package pl.parceo.service.core;

import org.jetbrains.annotations.VisibleForTesting;
import pl.parceo.model.constant.Currency;
import pl.parceo.model.constant.ReservationStatus;
import pl.parceo.model.dto.ReservationDTO;
import pl.parceo.model.entity.Reservation;
import pl.parceo.model.entity.ReservationTransaction;
import pl.parceo.model.entity.User;
import pl.parceo.repository.CRUDRepository;
import pl.parceo.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import pl.parceo.service.paymnet_transaction.TransactionService;

import java.time.LocalDate;
import java.util.Objects;
import java.util.Optional;

import static pl.parceo.exception.UserInputException.checkClientInput;
import static pl.parceo.model.constant.ReservationStatus.ACTIVE;
import static pl.parceo.model.constant.ReservationStatus.COMING;
import static pl.parceo.model.constant.ReservationStatus.EXPIRED;
import static pl.parceo.model.constant.ReservationStatus.UNVERIFIED;
import static pl.parceo.model.constant.ReservationStatus.VERIFIED;

@Service
@RequiredArgsConstructor
public class ReservationService extends CRUDServiceImpl<Reservation> {

    private final ReservationRepository reservationRepository;
    private final ReservationCalculatorService calculator;
    private final TransactionService transactionService;
    private final CamperPlaceService camperPlaceService;
    private final GuestService guestService;
    private final UserService userService;

    public Reservation create(ReservationDTO reservationDto) {
        final var camperPlace = camperPlaceService.findById(reservationDto.camperPlace().id());
        final var checkin = reservationDto.checkin();
        final var checkout = reservationDto.checkout();
        final var creator = resolveCreator(reservationDto);

        validateDates(checkout, checkin, camperPlace.getId());

        final var guest = Optional.ofNullable(reservationDto.guest().id()).isPresent()
                ? guestService.update(reservationDto.guest())
                : guestService.create(reservationDto.guest());
        final var status = Optional.ofNullable(reservationDto.reservationStatus())
                .orElse(getActuallReservationStatus(checkin, checkout));
        final var price = calculator.calculate(camperPlace.getPrice(), checkin.datesUntil(checkout).count());
        final var paid = reservationDto.paid() != null && reservationDto.paid();
        var r = Reservation.builder()
                .checkin(checkin)
                .checkout(checkout)
                .camperPlace(camperPlace)
                .guest(guest)
                .price(price)
                .paid(paid)
                .reservationStatus(status)
                .notes(reservationDto.notes())
                .creator(creator)
                .build();
        try {
            r = super.create(r);
            if (paid) {
                transactionService.create(
                        ReservationTransaction.builder()
                                .reservation(r)
                                .ammount(price)
                                .currency(Currency.PLN) //TODO this shouldn't be hardcoded!
                                .organisation(creator.getOrganisation())
                                .build()
                );
            }
        } catch (Exception e) {
            throw e;
        }

       return r;
    }

    @VisibleForTesting
    public ReservationStatus getActuallReservationStatus(LocalDate checkin, LocalDate checkout) {
        if (isActive(checkin, checkout)) {
            return ACTIVE;
        } else if (isExpired(checkout)) {
            return EXPIRED;
        } else {
            return COMING;
        }
    }

    private User resolveCreator(ReservationDTO reservationDto) {
        if (reservationDto.creator() != null) {
            return userService.findById(reservationDto.creator().id());
        }
        final var authentication = SecurityContextHolder.getContext().getAuthentication();
        Objects.requireNonNull(authentication, "Unauthorized call detected");
        return (User) userService.loadUserByUsername(authentication.getName());
    }

    private boolean isExpired(LocalDate checkout) {
        return LocalDate.now().isAfter(checkout);
    }

    public Reservation update(ReservationDTO reservationDto) {
        var camperPlace = camperPlaceService.findById(reservationDto.camperPlace().id());
        var checkin = reservationDto.checkin();
        var checkout = reservationDto.checkout();

        var r = findById(reservationDto.id());

        checkClientInput(r.getPaid() && !reservationDto.paid(),
                "Nie można cofnąć statusu płatności. W przypadku zwrotu należy usunąć rezerwację.");

        var datesOrCpChanged = !r.getCheckin().equals(checkin)
                || !r.getCheckout().equals(checkout)
                || !r.getCamperPlace().getIndex().equals(reservationDto.camperPlace().index());

        //it is checked because of the constraints and reservations overlapping
        if (datesOrCpChanged) {
            validateDates(checkout, checkin, camperPlace.getId(), r.getId());
            final var price = calculator.calculate(camperPlace.getPrice(), checkin.datesUntil(checkout).count());
            r.setCheckin(checkin);
            r.setCheckout(checkout);
            r.setCamperPlace(camperPlace);
            r.setPrice(price);
            if (
                !VERIFIED.equals(r.getReservationStatus())
                && !UNVERIFIED.equals(r.getReservationStatus())
            ) {
                r.setReservationStatus(getActuallReservationStatus(checkin, checkout));
            }
        }
        final var guest = guestService.update(reservationDto.guest());
        final var isAlreadyPaid = r.getPaid();
        r.setGuest(guest);
        r.setPaid(reservationDto.paid());
        r.setNotes(reservationDto.notes());
        try {
            r = super.update(r);
            if (!isAlreadyPaid && reservationDto.paid()) {
                transactionService.create(
                        ReservationTransaction.builder()
                                .reservation(r)
                                .ammount(r.getPrice())
                                .currency(Currency.PLN) //TODO this shouldn't be hardcoded!
                                .organisation(r.getCreator().getOrganisation()) //TODO in future change this to r.getOrganisation()
                                .build()
                );
            }
        } catch (Exception e) {
            throw e;
        }
        return r;
    }

    public int setActualReservationStatuses() {
        return reservationRepository.setActualReservationStatuses();
    }

    private boolean isActive(LocalDate checkin, LocalDate checkout) {
        LocalDate currentDate = LocalDate.now();
        return checkin.isBefore(currentDate.plusDays(1)) && checkout.isAfter(currentDate.minusDays(1));
    }

    private void validateDates(LocalDate checkout, LocalDate checkin, Integer camperPlaceId) {
        validateDates(checkout, checkin, camperPlaceId, null);
    }

    private void validateDates(LocalDate checkout, LocalDate checkin, Integer camperPlaceId, Integer reservationId) {
        checkClientInput(checkout.isBefore(LocalDate.now()), "Rezerwacja już wygasła");
        checkClientInput(checkout.isBefore(checkin), "Data wyjazdu nie może być przed datą wjazdu");
        checkClientInput(checkout.equals(checkin), "Czas trwania rezerwacji musi wynosić minimum 1 dobę");
        checkClientInput(
                camperPlaceService.hasOverlappingReservation(camperPlaceId, checkin, checkout, reservationId),
                "Parcela jest już zajęta!"
        );
    }

    @Override
    protected CRUDRepository<Reservation> getRepository() {
        return reservationRepository;
    }

}


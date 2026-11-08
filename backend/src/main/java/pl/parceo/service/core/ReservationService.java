package pl.parceo.service.core;

import pl.parceo.model.constant.ReservationStatus;
import pl.parceo.model.dto.ReservationDTO;
import pl.parceo.model.entity.Reservation;
import pl.parceo.model.entity.User;
import pl.parceo.repository.CRUDRepository;
import pl.parceo.repository.ReservationRepository;
import pl.parceo.service.core.StatisticsService.StatisticsModel;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

import static pl.parceo.exception.DateValidationException.checkClientInput;
import static pl.parceo.model.constant.ReservationStatus.ACTIVE;
import static pl.parceo.model.constant.ReservationStatus.COMING;
import static pl.parceo.model.constant.ReservationStatus.EXPIRED;
import static pl.parceo.model.constant.ReservationStatus.UNVERIFIED;
import static pl.parceo.model.constant.ReservationStatus.VERIFIED;

@Service
@RequiredArgsConstructor
public class ReservationService extends CRUDServiceImpl<Reservation> {

    private final ReservationRepository reservationRepository;
    private final GuestService guestService;
    private final CamperPlaceService camperPlaceService;
    private final ReservationCalculatorService calculator;
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

        final var price = Optional.ofNullable(reservationDto.price())
                .orElse(calculator.calculate(camperPlace.getPrice(), checkin.datesUntil(checkout).count()).doubleValue());

        final var r = Reservation.builder()
                .checkin(checkin)
                .checkout(checkout)
                .camperPlace(camperPlace)
                .guest(guest)
                .price(BigDecimal.valueOf(price))
                .paid(reservationDto.paid() != null && reservationDto.paid())
                .reservationStatus(status)
                .notes(reservationDto.notes())
                .creator(creator);

       return super.create(r.build());
    }

    public ReservationStatus getActuallReservationStatus(Reservation reservation) {
        return getActuallReservationStatus(reservation.getCheckin(), reservation.getCheckout());
    }

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

        var datesOrCpChanged = !r.getCheckin().equals(checkin)
                || !r.getCheckout().equals(checkout)
                || !r.getCamperPlace().getIndex().equals(reservationDto.camperPlace().index());

    //it is checked because of the constraints and reservations overlapping
        if (datesOrCpChanged) {
            validateDates(checkout, checkin, camperPlace.getId(), r.getId());
            r.setCheckin(checkin);
            r.setCheckout(checkout);
            r.setCamperPlace(camperPlace);
            r.setPrice(calculator.calculate(camperPlace.getPrice(), checkin.datesUntil(checkout).count()));
            if (
                !VERIFIED.equals(r.getReservationStatus())
                && !UNVERIFIED.equals(r.getReservationStatus())
            ) {
                r.setReservationStatus(getActuallReservationStatus(checkin, checkout));
            }
        }

        var guest = guestService.update(reservationDto.guest());

        r.setGuest(guest);
        r.setPaid(reservationDto.paid());
        r.setNotes(reservationDto.notes());
        return super.update(r);
    }

    public List<StatisticsModel.Revenue> countRevenueOfAllCamperPlaces(boolean isPaid, int month, int year) {
        return reservationRepository.countRevenueOfAllCamperPlaces(isPaid, month, year);
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


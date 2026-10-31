package pl.parceo.service.core;

import pl.parceo.BaseIT;
import pl.parceo.exception.UserInputException;
import pl.parceo.helper.AuthenticationHelper;
import pl.parceo.model.constant.Country;
import pl.parceo.model.constant.ReservationStatus;
import pl.parceo.model.dto.GuestDTO;
import pl.parceo.model.dto.ReservationDTO;
import pl.parceo.service.util.DtoMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static pl.parceo.helper.AuthenticationHelper.IT_USER_LOGIN;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

public class ReservationServiceIT extends BaseIT {

    @AfterEach
    public void tearDownSecurity() {
        AuthenticationHelper.clearAuthentication();
    }

    @Test
    public void shouldPersistAndRetrieveReservationInDatabase() {
        // Given
        final var checkin = LocalDate.parse("2030-05-01");
        final var checkout = LocalDate.parse("2030-05-05");
        final var cpPrice = BigDecimal.valueOf(50);

        final var createdReservation = createReservationWithNewData(
                "1_IT_TYPE",
                cpPrice,
                "1_IT_CP",
                "Jan",
                "Kowalski",
                Country.POLAND,
                checkin,
                checkout,
                false
        );

        // When
        final var foundReservation = reservationService.findById(createdReservation.getId());

        // Then
        assertThat(foundReservation).isNotNull();
        assertThat(foundReservation.getId()).isEqualTo(createdReservation.getId());
        assertThat(foundReservation.getCheckin()).isEqualTo(checkin);
        assertThat(foundReservation.getCheckout()).isEqualTo(checkout);
        assertThat(foundReservation.getPaid()).isFalse();
        assertThat(foundReservation.getReservationStatus()).isEqualTo(ReservationStatus.COMING);
        assertThat(foundReservation.getCamperPlace().getIndex()).isEqualTo("1_IT_CP");
        assertThat(foundReservation.getGuest().getFirstname()).isEqualTo("Jan");
        assertThat(foundReservation.getGuest().getLastname()).isEqualTo("Kowalski");
        assertThat(foundReservation.getCreator().getLogin()).isEqualTo(IT_USER_LOGIN);
        assertThat(foundReservation.getPrice()).isPositive();
    }

    @Test
    public void shouldCreateReservationWithExistingGuest() {
        // Given
        final var guest = createGuest("Existing", "Guest", Country.POLAND);
        final var cpType = createCpType("2_IT_TYPE", BigDecimal.valueOf(60));
        final var cp = createCamperPlace("2_IT_CP", cpType);
        final var checkin = LocalDate.parse("2030-06-01");
        final var checkout = LocalDate.parse("2030-06-04");

        final var reservationDto = ReservationDTO.builder()
                .checkin(checkin)
                .checkout(checkout)
                .guest(DtoMapper.getGuestDTO(guest))
                .camperPlace(DtoMapper.getCamperPlaceDto(cp))
                .reservationStatus(ReservationStatus.COMING)
                .paid(true)
                .build();

        // When
        final var createdReservation = reservationService.create(reservationDto);

        // Then
        assertThat(createdReservation).isNotNull();
        assertThat(createdReservation.getGuest().getId()).isEqualTo(guest.getId());
        assertThat(createdReservation.getPaid()).isTrue();

        final var retrievedGuest = guestService.findById(guest.getId());
        assertThat(retrievedGuest.getId()).isEqualTo(guest.getId());
    }

    @Test
    public void shouldNotAllowCreatingReservationInBetweenOtherReservationDates() {
        // Given
        final var cpType = createCpType("3_IT_TYPE", BigDecimal.valueOf(70));
        final var cp = createCamperPlace("3_IT_CP", cpType);
        final var guest1 = createGuest("Guest", "One", Country.POLAND);
        final var guest2 = createGuest("Guest", "Two", Country.GERMANY);

        final var checkin1 = LocalDate.parse("2030-07-01");
        final var checkout1 = LocalDate.parse("2030-07-06");
        createReservation(cp, checkin1, checkout1, guest1, false);

        // When & Then - overlapping check-in
        final var overlappingDto = ReservationDTO.builder()
                .checkin(LocalDate.parse("2030-07-05"))
                .checkout(LocalDate.parse("2030-07-08"))
                .guest(DtoMapper.getGuestDTO(guest2))
                .camperPlace(DtoMapper.getCamperPlaceDto(cp))
                .paid(false)
                .reservationStatus(ReservationStatus.COMING)
                .build();

        assertThatThrownBy(() -> reservationService.create(overlappingDto))
                .isInstanceOf(UserInputException.class)
                .hasMessage("Parcela jest już zajęta!");
    }

    @Test
    public void shouldUpdateReservationInDatabaseSuccessfully() {
        // Given
        final var initialCheckin = LocalDate.parse("2030-08-01");
        final var initialCheckout = LocalDate.parse("2030-08-05");
        final var reservation = createReservationWithNewData(
                "4_IT_TYPE",
                BigDecimal.valueOf(80),
                "4_IT_CP",
                "Piotr",
                "Zieliński",
                Country.POLAND,
                initialCheckin,
                initialCheckout,
                false
        );

        final var newCheckin = LocalDate.parse("2030-08-10");
        final var newCheckout = LocalDate.parse("2030-08-16");
        final var updatedGuestDto = new GuestDTO(
                reservation.getGuest().getId(),
                "Piotr-Updated",
                "Zieliński-Updated",
                null,
                null,
                null,
                Country.POLAND.getIsoCode()
        );

        final var updateDto = ReservationDTO.builder()
                .id(reservation.getId())
                .checkin(newCheckin)
                .checkout(newCheckout)
                .guest(updatedGuestDto)
                .camperPlace(DtoMapper.getCamperPlaceDto(reservation.getCamperPlace()))
                .paid(true)
                .reservationStatus(ReservationStatus.COMING)
                .build();

        // When
        reservationService.update(updateDto);

        // Then
        final var updatedReservation = reservationService.findById(reservation.getId());
        assertThat(updatedReservation.getCheckin()).isEqualTo(newCheckin);
        assertThat(updatedReservation.getCheckout()).isEqualTo(newCheckout);
        assertThat(updatedReservation.getPaid()).isTrue();
        assertThat(updatedReservation.getGuest().getFirstname()).isEqualTo("Piotr-Updated");
        assertThat(updatedReservation.getGuest().getLastname()).isEqualTo("Zieliński-Updated");
    }

    @Test
    public void shouldRejectUpdateWhenOverlappingAnotherReservationInDatabase() {
        // Given
        final var cpType = createCpType("5_IT_TYPE", BigDecimal.valueOf(90));
        final var cp = createCamperPlace("5_IT_CP", cpType);
        final var guest1 = createGuest("Adam", "Pierwszy", Country.POLAND);
        final var guest2 = createGuest("Ewa", "Druga", Country.POLAND);

        final var res1 = createReservation(cp, LocalDate.parse("2030-09-01"), LocalDate.parse("2030-09-06"), guest1, false);
        final var res2 = createReservation(cp, LocalDate.parse("2030-09-10"), LocalDate.parse("2030-09-15"), guest2, false);

        // When & Then - try updating res2 to overlap res1
        final var conflictingUpdateDto = ReservationDTO.builder()
                .id(res2.getId())
                .checkin(LocalDate.parse("2030-09-04"))
                .checkout(LocalDate.parse("2030-09-12"))
                .guest(DtoMapper.getGuestDTO(guest2))
                .camperPlace(DtoMapper.getCamperPlaceDto(cp))
                .paid(false)
                .reservationStatus(ReservationStatus.COMING)
                .build();

        assertThatThrownBy(() -> reservationService.update(conflictingUpdateDto))
                .isInstanceOf(UserInputException.class)
                .hasMessage("Parcela jest już zajęta!");
    }

    @Test
    public void shouldPassAnUpdateWhenReservationDatesOverlapsWithThemSelf() {
        final var checkin = LocalDate.parse("2067-01-01");
        var checkout = LocalDate.parse("2067-01-15");

        var reservation = createReservationWithNewData(
                "IT_TYPE_6",
                BigDecimal.valueOf(100),
                "6_IT_CP",
                "Jan",
                "Kowalski",
                Country.POLAND,
                checkin,
                checkout,
                false);

        checkout = LocalDate.parse("2067-01-17");
        final var updatePayload = ReservationDTO.builder()
                .id(reservation.getId())
                .checkin(checkin)
                .checkout(checkout)
                .guest(DtoMapper.getGuestDTO(reservation.getGuest()))
                .camperPlace(DtoMapper.getCamperPlaceDto(reservation.getCamperPlace()))
                .paid(reservation.getPaid())
                .reservationStatus(reservation.getReservationStatus())
                .build();

        reservationService.update(updatePayload);

        reservation = reservationService.findById(reservation.getId());

        assertThat(reservation).isNotNull();
        assertThat(reservation.getCheckout()).isEqualTo(checkout);
    }

    @Test
    public void shouldNotAllowReservationsOverlapping() {
        final var cpType = createCpType("7_IT_TYPE", BigDecimal.valueOf(70));
        final var cp = createCamperPlace("7_IT_CP", cpType);
        final var guest1 = createGuest("dummy", "dummyLN", Country.POLAND);
        final var guest2 = createGuest("dummy2", "dummyLN2", Country.GERMANY);

        final var checkin1 = LocalDate.parse("2030-10-10");
        final var checkout1 = LocalDate.parse("2030-10-15");
        createReservation(cp, checkin1, checkout1, guest1, false);

        // When & Then - overlapping check-in
        final var overlappingDto = ReservationDTO.builder()
                .checkin(LocalDate.parse("2030-10-08"))
                .checkout(LocalDate.parse("2030-10-17"))
                .guest(DtoMapper.getGuestDTO(guest2))
                .camperPlace(DtoMapper.getCamperPlaceDto(cp))
                .paid(false)
                .reservationStatus(ReservationStatus.COMING)
                .build();

        assertThatThrownBy(() -> reservationService.create(overlappingDto))
                .isInstanceOf(UserInputException.class)
                .hasMessage("Parcela jest już zajęta!");
    }

    @Test
    public void shouldNotAllowActiveReservationsOverlapping() {
        final var cpType = createCpType("8_IT_TYPE", BigDecimal.valueOf(70));
        final var cp = createCamperPlace("8_IT_CP", cpType);
        final var guest1 = createGuest("fn", "ln", Country.POLAND);
        final var guest2 = createGuest("fn2", "ln2", Country.GERMANY);

        final var checkin1 = LocalDate.now().minusDays(2);
        final var checkout1 = LocalDate.now().plusDays(2);
        createReservation(cp, checkin1, checkout1, guest1, false);

        // When & Then - overlapping check-in
        final var overlappingDto = ReservationDTO.builder()
                .checkin(LocalDate.now())
                .checkout(LocalDate.now().plusDays(1))
                .guest(DtoMapper.getGuestDTO(guest2))
                .camperPlace(DtoMapper.getCamperPlaceDto(cp))
                .paid(false)
                .reservationStatus(ReservationStatus.COMING)
                .build();

        assertThatThrownBy(() -> reservationService.create(overlappingDto))
                .isInstanceOf(UserInputException.class)
                .hasMessage("Parcela jest już zajęta!");
    }

    @Test
    public void shouldNotAllowReservationsOverlappingWhenReservationTakesOneDay() {
        final var cpType = createCpType("8_IT_TYPE", BigDecimal.valueOf(70));
        final var cp = createCamperPlace("8_IT_CP", cpType);
        final var guest1 = createGuest("fn3", "ln3", Country.POLAND);
        final var guest2 = createGuest("fn4", "ln4", Country.GERMANY);
        final var checkin1 = LocalDate.parse("2030-12-07");
        final var checkout1 = LocalDate.parse("2030-12-08");
        createReservation(cp, checkin1, checkout1, guest1, false);

        // When & Then - overlapping check-in
        final var overlappingDto = ReservationDTO.builder()
                .checkin(LocalDate.parse("2030-12-07"))
                .checkout(LocalDate.parse("2030-12-08"))
                .guest(DtoMapper.getGuestDTO(guest2))
                .camperPlace(DtoMapper.getCamperPlaceDto(cp))
                .paid(false)
                .reservationStatus(ReservationStatus.COMING)
                .build();

        assertThatThrownBy(() -> reservationService.create(overlappingDto))
                .isInstanceOf(UserInputException.class)
                .hasMessage("Parcela jest już zajęta!");
    }

    @Test
    public void shouldAllowBackToBackReservationsWhenReservationTakesOneDay() {
        final var cpType = createCpType("8_IT_TYPE", BigDecimal.valueOf(70));
        final var cp = createCamperPlace("9_IT_CP", cpType);
        final var guest = createGuest("fn3", "ln3", Country.POLAND);
        final var checkin1 = LocalDate.parse("2030-06-07");
        final var checkout1 = LocalDate.parse("2030-06-08");
        final var checkin2 = LocalDate.parse("2030-06-08");
        final var checkout2 = LocalDate.parse("2030-06-09");
        final var checkin3 = LocalDate.parse("2030-06-10");
        final var checkout3 = LocalDate.parse("2030-06-11");

        createReservation(cp, checkin1, checkout1, guest, false);
        createReservation(cp, checkin2, checkout2, guest, false);
        createReservation(cp, checkin3, checkout3, guest, false);

        assertThat(camperPlaceService.getOccupiedDates(cp.getId())).containsExactly(
                checkin1.datesUntil(checkout1).toList(),
                checkin2.datesUntil(checkout2).toList(),
                checkin3.datesUntil(checkout3).toList()
        );
    }
}


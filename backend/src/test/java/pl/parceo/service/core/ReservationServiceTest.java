package pl.parceo.service.core;

import pl.parceo.exception.UserInputException;
import pl.parceo.helper.AuthenticationHelper;
import pl.parceo.model.constant.ReservationStatus;
import pl.parceo.model.constant.UserRole;
import pl.parceo.model.dto.CamperPlaceDTO;
import pl.parceo.model.dto.CamperPlaceTypeDTO;
import pl.parceo.model.dto.GuestDTO;
import pl.parceo.model.dto.ReservationDTO;
import pl.parceo.model.entity.CamperPlace;
import pl.parceo.model.entity.CamperPlaceType;
import pl.parceo.model.entity.Guest;
import pl.parceo.model.entity.Reservation;
import pl.parceo.model.entity.User;
import pl.parceo.repository.ReservationRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class ReservationServiceTest {

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private GuestService guestService;

    @Mock
    private CamperPlaceService camperPlaceService;

    @Mock
    private ReservationCalculatorService calculator;

    @Mock
    private UserService userService;

    @InjectMocks
    private ReservationService reservationService;

    private static final String USERNAME = "testUser";
    private static final BigDecimal DEFAULT_PRICE = BigDecimal.valueOf(100);
    private static final BigDecimal CALCULATED_PRICE = BigDecimal.valueOf(500);

    private User defaultUser;
    private CamperPlace defaultCamperPlace;
    private Guest defaultGuest;

    @BeforeEach
    public void setUp() {
        defaultUser = User.builder()
                .username(USERNAME)
                .login(USERNAME)
                .userRole(UserRole.ADMIN)
                .build();

        AuthenticationHelper.authenticateUser(defaultUser);

        final var camperPlaceType = CamperPlaceType.builder()
                .id(1)
                .typeName("Standard")
                .price(DEFAULT_PRICE)
                .build();

        defaultCamperPlace = CamperPlace.builder()
                .id(1)
                .index("1")
                .price(DEFAULT_PRICE)
                .camperPlaceType(camperPlaceType)
                .build();

        defaultGuest = Guest.builder()
                .id(1)
                .firstname("Jan")
                .lastname("Kowalski")
                .build();
    }

    @AfterEach
    public void tearDown() {
        AuthenticationHelper.clearAuthentication();
    }

    @Test
    public void shouldSetStatusToActiveWhenDatesCoverCurrentDate() {
        // Given
        final var checkin = LocalDate.now();
        final var checkout = LocalDate.now().plusDays(3);
        final var guestDto = createGuestDto(null);
        final var cpDto = createCamperPlaceDto(1, "1");
        final var reservationDto = createReservationDto(null, checkin, checkout, guestDto, cpDto, false, null);

        when(userService.loadUserByUsername(USERNAME)).thenReturn(defaultUser);
        when(camperPlaceService.findById(1)).thenReturn(defaultCamperPlace);
        when(camperPlaceService.hasOverlappingReservation(1, checkin, checkout, null)).thenReturn(false);
        when(guestService.create(guestDto)).thenReturn(defaultGuest);
        when(calculator.calculate(DEFAULT_PRICE, 3L)).thenReturn(CALCULATED_PRICE);
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        final var result = reservationService.create(reservationDto);

        // Then
        assertThat(result.getReservationStatus()).isEqualTo(ReservationStatus.ACTIVE);
    }

    @Test
    public void shouldSetStatusToExpiredWhenCheckoutIsInThePast() {
        // Given
        final var checkin = LocalDate.now().minusDays(5);
        final var checkout = LocalDate.now().minusDays(1);

        // When
        final var result = reservationService.getActuallReservationStatus(checkin, checkout);

        // Then
        assertThat(result).isEqualTo(ReservationStatus.EXPIRED);
    }

    @Test
    public void shouldSetStatusToComingWhenCheckinIsInTheFuture() {
        // Given
        final var checkin = LocalDate.now().plusDays(1);
        final var checkout = LocalDate.now().plusDays(3);
        final var guestDto = createGuestDto(null);
        final var cpDto = createCamperPlaceDto(1, "1");
        final var reservationDto = createReservationDto(null, checkin, checkout, guestDto, cpDto, false, null);

        when(userService.loadUserByUsername(USERNAME)).thenReturn(defaultUser);
        when(camperPlaceService.findById(1)).thenReturn(defaultCamperPlace);
        when(camperPlaceService.hasOverlappingReservation(1, checkin, checkout, null)).thenReturn(false);
        when(guestService.create(guestDto)).thenReturn(defaultGuest);
        when(calculator.calculate(DEFAULT_PRICE, 2L)).thenReturn(CALCULATED_PRICE);
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        final var result = reservationService.create(reservationDto);

        // Then
        assertThat(result.getReservationStatus()).isEqualTo(ReservationStatus.COMING);
    }

    @Test
    public void shouldThrowExceptionWhenUserIsUnauthorized() {
        // Given
        AuthenticationHelper.clearAuthentication();
        final var checkin = LocalDate.now().plusDays(1);
        final var checkout = LocalDate.now().plusDays(3);
        final var reservationDto = createReservationDto(null, checkin, checkout, createGuestDto(null), createCamperPlaceDto(1, "1"), false, null);

        when(camperPlaceService.findById(1)).thenReturn(defaultCamperPlace);

        // When & Then
        assertThatThrownBy(() -> reservationService.create(reservationDto))
                .isInstanceOf(NullPointerException.class)
                .hasMessageContaining("Unauthorized call detected");

        verify(reservationRepository, never()).save(any(Reservation.class));
    }

    @Test
    public void shouldThrowExceptionWhenCheckoutBeforeCheckin() {
        // Given
        final var checkin = LocalDate.now().plusDays(5);
        final var checkout = LocalDate.now().plusDays(2);
        final var reservationDto = createReservationDto(null, checkin, checkout, createGuestDto(null), createCamperPlaceDto(1, "1"), false, null);

        when(camperPlaceService.findById(1)).thenReturn(defaultCamperPlace);
        when(userService.loadUserByUsername(USERNAME)).thenReturn(defaultUser);

        // When & Then
        assertThatThrownBy(() -> reservationService.create(reservationDto))
                .isInstanceOf(UserInputException.class)
                .hasMessage("Data wyjazdu nie może być przed datą wjazdu");

        verify(reservationRepository, never()).save(any(Reservation.class));
    }

    @Test
    public void shouldThrowExceptionWhenStayDurationIsZeroDays() {
        // Given
        final var sameDate = LocalDate.now().plusDays(5);
        final var reservationDto = createReservationDto(null, sameDate, sameDate, createGuestDto(null), createCamperPlaceDto(1, "1"), false, null);

        when(camperPlaceService.findById(1)).thenReturn(defaultCamperPlace);
        when(userService.loadUserByUsername(USERNAME)).thenReturn(defaultUser);

        // When & Then
        assertThatThrownBy(() -> reservationService.create(reservationDto))
                .isInstanceOf(UserInputException.class)
                .hasMessage("Czas trwania rezerwacji musi wynosić minimum 1 dobę");

        verify(reservationRepository, never()).save(any(Reservation.class));
    }

    @Test
    public void shouldThrowExceptionWhenReservationOverlapsExistingOne() {
        // Given
        final var checkin = LocalDate.now().plusDays(5);
        final var checkout = LocalDate.now().plusDays(8);
        final var reservationDto = createReservationDto(null, checkin, checkout, createGuestDto(null), createCamperPlaceDto(1, "1"), false, null);

        when(camperPlaceService.findById(1)).thenReturn(defaultCamperPlace);
        when(userService.loadUserByUsername(USERNAME)).thenReturn(defaultUser);
        when(camperPlaceService.hasOverlappingReservation(1, checkin, checkout, null)).thenReturn(true);

        // When & Then
        assertThatThrownBy(() -> reservationService.create(reservationDto))
                .isInstanceOf(UserInputException.class)
                .hasMessage("Parcela jest już zajęta!");

        verify(reservationRepository, never()).save(any(Reservation.class));
    }

    @Test
    public void shouldUpdateReservationWithoutDateOrCamperPlaceChangeSuccessfully() {
        // Given
        final var checkin = LocalDate.now().plusDays(3);
        final var checkout = LocalDate.now().plusDays(7);
        final var existingReservation = createExistingReservation(10, checkin, checkout, defaultCamperPlace, defaultGuest, false);

        final var updatedGuestDto = createGuestDto(1);
        final var updatedGuest = Guest.builder().id(1).firstname("Adam").lastname("Nowak").build();
        final var cpDto = createCamperPlaceDto(1, "1");
        final var updateDto = createReservationDto(10, checkin, checkout, updatedGuestDto, cpDto, true, ReservationStatus.COMING);

        when(camperPlaceService.findById(1)).thenReturn(defaultCamperPlace);
        when(reservationRepository.findById(10)).thenReturn(Optional.of(existingReservation));
        when(guestService.update(updatedGuestDto)).thenReturn(updatedGuest);

        // When
        reservationService.update(updateDto);

        // Then
        final var captor = ArgumentCaptor.forClass(Reservation.class);
        verify(reservationRepository).save(captor.capture());

        final var saved = captor.getValue();
        assertThat(saved.getPaid()).isTrue();
        assertThat(saved.getGuest()).isEqualTo(updatedGuest);
        assertThat(saved.getCheckin()).isEqualTo(checkin);
        assertThat(saved.getCheckout()).isEqualTo(checkout);

        verify(camperPlaceService, never()).hasOverlappingReservation(any(), any(), any(), any());
        verify(calculator, never()).calculate(any(), anyLong());
    }

    @Test
    public void shouldUpdateReservationWithChangedDatesAndRecalculatePrice() {
        // Given
        final var originalCheckin = LocalDate.now().plusDays(10);
        final var originalCheckout = LocalDate.now().plusDays(15);
        final var existingReservation = createExistingReservation(10, originalCheckin, originalCheckout, defaultCamperPlace, defaultGuest, false);

        final var newCheckin = LocalDate.now();
        final var newCheckout = LocalDate.now().plusDays(4);
        final var cpDto = createCamperPlaceDto(1, "1");
        final var guestDto = createGuestDto(1);
        final var updateDto = createReservationDto(10, newCheckin, newCheckout, guestDto, cpDto, true, null);

        when(camperPlaceService.findById(1)).thenReturn(defaultCamperPlace);
        when(reservationRepository.findById(10)).thenReturn(Optional.of(existingReservation));
        when(camperPlaceService.hasOverlappingReservation(1, newCheckin, newCheckout, 10)).thenReturn(false);
        when(calculator.calculate(DEFAULT_PRICE, 4L)).thenReturn(BigDecimal.valueOf(400));
        when(guestService.update(guestDto)).thenReturn(defaultGuest);

        // When
        reservationService.update(updateDto);

        // Then
        final var captor = ArgumentCaptor.forClass(Reservation.class);
        verify(reservationRepository).save(captor.capture());

        final var saved = captor.getValue();
        assertThat(saved.getCheckin()).isEqualTo(newCheckin);
        assertThat(saved.getCheckout()).isEqualTo(newCheckout);
        assertThat(saved.getPrice()).isEqualTo(BigDecimal.valueOf(400));
        assertThat(saved.getReservationStatus()).isEqualTo(ReservationStatus.ACTIVE);
        assertThat(saved.getPaid()).isTrue();

        verify(calculator).calculate(DEFAULT_PRICE, 4L);
    }

    @Test
    public void shouldThrowExceptionWhenUpdatingToOccupiedDates() {
        // Given
        final var originalCheckin = LocalDate.now().plusDays(10);
        final var originalCheckout = LocalDate.now().plusDays(15);
        final var existingReservation = createExistingReservation(10, originalCheckin, originalCheckout, defaultCamperPlace, defaultGuest, false);

        final var newCheckin = LocalDate.now().plusDays(1);
        final var newCheckout = LocalDate.now().plusDays(4);
        final var cpDto = createCamperPlaceDto(1, "1");
        final var updateDto = createReservationDto(10, newCheckin, newCheckout, createGuestDto(1), cpDto, false, null);

        when(camperPlaceService.findById(1)).thenReturn(defaultCamperPlace);
        when(reservationRepository.findById(10)).thenReturn(Optional.of(existingReservation));
        when(camperPlaceService.hasOverlappingReservation(1, newCheckin, newCheckout, 10)).thenReturn(true);

        // When & Then
        assertThatThrownBy(() -> reservationService.update(updateDto))
                .isInstanceOf(UserInputException.class)
                .hasMessage("Parcela jest już zajęta!");

        verify(reservationRepository, never()).save(any(Reservation.class));
    }

    @Test
    public void shouldThrowExceptionWhenUpdatingWithInvalidDates() {
        // Given
        final var originalCheckin = LocalDate.now().plusDays(10);
        final var originalCheckout = LocalDate.now().plusDays(15);
        final var existingReservation = createExistingReservation(10, originalCheckin, originalCheckout, defaultCamperPlace, defaultGuest, false);

        final var invalidCheckin = LocalDate.now().plusDays(5);
        final var invalidCheckout = LocalDate.now().plusDays(2);
        final var cpDto = createCamperPlaceDto(1, "1");
        final var updateDto = createReservationDto(10, invalidCheckin, invalidCheckout, createGuestDto(1), cpDto, false, null);

        when(camperPlaceService.findById(1)).thenReturn(defaultCamperPlace);
        when(reservationRepository.findById(10)).thenReturn(Optional.of(existingReservation));

        // When & Then
        assertThatThrownBy(() -> reservationService.update(updateDto))
                .isInstanceOf(UserInputException.class)
                .hasMessage("Data wyjazdu nie może być przed datą wjazdu");

        verify(reservationRepository, never()).save(any(Reservation.class));
    }

    private GuestDTO createGuestDto(Integer id) {
        return new GuestDTO(id, "Jan", "Kowalski", null, null, null, "PL");
    }

    private CamperPlaceDTO createCamperPlaceDto(Integer id, String index) {
        final var typeDto = new CamperPlaceTypeDTO(1, "Standard", DEFAULT_PRICE);
        return new CamperPlaceDTO(id, index, typeDto, null);
    }

    private ReservationDTO createReservationDto(
            Integer id,
            LocalDate checkin,
            LocalDate checkout,
            GuestDTO guestDto,
            CamperPlaceDTO cpDto,
            boolean paid,
            ReservationStatus status
    ) {
        return ReservationDTO.builder()
                .id(id)
                .checkin(checkin)
                .checkout(checkout)
                .guest(guestDto)
                .camperPlace(cpDto)
                .paid(paid)
                .reservationStatus(status)
                .build();
    }

    private Reservation createExistingReservation(
            int id,
            LocalDate checkin,
            LocalDate checkout,
            CamperPlace camperPlace,
            Guest guest,
            boolean paid
    ) {
        return Reservation.builder()
                .id(id)
                .checkin(checkin)
                .checkout(checkout)
                .camperPlace(camperPlace)
                .guest(guest)
                .price(DEFAULT_PRICE)
                .paid(paid)
                .reservationStatus(ReservationStatus.COMING)
                .creator(defaultUser)
                .build();
    }
}

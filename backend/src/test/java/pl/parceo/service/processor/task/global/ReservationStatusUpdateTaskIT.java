package pl.parceo.service.processor.task.global;

import pl.parceo.BaseIT;
import pl.parceo.helper.AuthenticationHelper;
import pl.parceo.model.constant.Country;
import pl.parceo.model.constant.ReservationStatus;
import pl.parceo.model.entity.CamperPlace;
import pl.parceo.model.entity.CamperPlaceType;
import pl.parceo.model.entity.Guest;
import pl.parceo.model.entity.Reservation;
import pl.parceo.model.entity.User;
import pl.parceo.repository.ReservationRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class ReservationStatusUpdateTaskIT extends BaseIT {

    @Autowired
    private ReservationStatusUpdateTask task;
    @Autowired
    private ReservationRepository reservationRepository;
    @PersistenceContext
    private EntityManager entityManager;

    private CamperPlaceType type;
    private Guest guest;
    private User creator;
    private int placeCounter = 100;

    @BeforeEach
    void setUpFixtures() {
        type = createCpType("status-camperPlaceType", BigDecimal.valueOf(80));
        guest = createGuest("Status", "Guest", Country.POLAND);
        creator = (User) userService.loadUserByUsername(AuthenticationHelper.IT_USER_LOGIN);
    }

    private Reservation persistReservation(LocalDate checkin, LocalDate checkout, ReservationStatus status) {
        CamperPlace place = createCamperPlace(String.valueOf(placeCounter++), type);
        return reservationRepository.save(Reservation.builder()
                .checkin(checkin).checkout(checkout)
                .camperPlace(place).guest(guest).creator(creator)
                .price(BigDecimal.TEN).paid(false)
                .reservationStatus(status)
                .build());
    }

    private ReservationStatus statusAfterTask(Reservation reservation) {
        task.updateReservationStatus();
        entityManager.clear();
        return reservationRepository.findById(reservation.getId()).orElseThrow().getReservationStatus();
    }

    @Test
    void movesAPastReservationToExpired() {
        var past = persistReservation(LocalDate.now().minusDays(10), LocalDate.now().minusDays(3), ReservationStatus.COMING);

        assertThat(statusAfterTask(past)).isEqualTo(ReservationStatus.EXPIRED);
    }

    @Test
    void movesAnOngoingReservationToActive() {
        var ongoing = persistReservation(LocalDate.now().minusDays(1), LocalDate.now().plusDays(4), ReservationStatus.COMING);

        assertThat(statusAfterTask(ongoing)).isEqualTo(ReservationStatus.ACTIVE);
    }

    @Test
    void leavesAFutureReservationAsComing() {
        var future = persistReservation(LocalDate.now().plusDays(20), LocalDate.now().plusDays(25), ReservationStatus.COMING);

        assertThat(statusAfterTask(future)).isEqualTo(ReservationStatus.COMING);
    }

    @Test
    void neverTouchesUnverifiedReservations() {
        var unverified = persistReservation(LocalDate.now().minusDays(10), LocalDate.now().minusDays(3), ReservationStatus.UNVERIFIED);

        assertThat(statusAfterTask(unverified)).isEqualTo(ReservationStatus.UNVERIFIED);
    }
}

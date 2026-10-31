package pl.parceo.service.processor.task.webappreservationflow;

import pl.parceo.exception.AuthenticationException;
import pl.parceo.model.constant.ReservationStatus;
import pl.parceo.model.constant.TaskType;
import pl.parceo.model.entity.Reservation;
import pl.parceo.model.entity.Task;
import pl.parceo.service.core.ReservationService;
import pl.parceo.service.processor.TaskService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReservationVerifierTaskTest {

    private static final String TARGET_ID = "target-123";
    private static final int RESERVATION_ID = 42;

    @Mock
    private TaskService taskService;
    @Mock
    private ReservationService reservationService;

    private Task taskEntity;
    private ReservationVerifierTask task;

    @BeforeEach
    void setUp() {
        taskEntity = Task.builder()
                .targetId(TARGET_ID)
                .taskType(TaskType.RESERVATION_STATUS_VERIFIER_TASK)
                .build();
        task = new ReservationVerifierTask(taskService, reservationService, taskEntity);
    }

    private Task holderTaskWithReservationId() {
        final var holder = Task.builder()
                .targetId(TARGET_ID)
                .payload(RESERVATION_ID)
                .taskType(TaskType.TEMPORARY_PAYLOAD_HOLDER_TASK)
                .build();
        return holder;
    }

    private Reservation reservationWithStatus(ReservationStatus status) {
        final var reservation = new Reservation();
        reservation.setId(RESERVATION_ID);
        reservation.setReservationStatus(status);
        return reservation;
    }

    @Test
    void marksAnUnverifiedReservationAsVerified() {
        when(taskService.findPayloadHolderTaskByTargetId(TARGET_ID)).thenReturn(holderTaskWithReservationId());
        final var reservation = reservationWithStatus(ReservationStatus.UNVERIFIED);
        when(reservationService.findById(RESERVATION_ID)).thenReturn(reservation);

        task.doTask();

        assertThat(reservation.getReservationStatus()).isEqualTo(ReservationStatus.VERIFIED);
        verify(reservationService).update(reservation);
    }

    @Test
    void doesNothingWhenTheReservationIsNoLongerUnverified() {
        when(taskService.findPayloadHolderTaskByTargetId(TARGET_ID)).thenReturn(holderTaskWithReservationId());
        final var reservation = reservationWithStatus(ReservationStatus.VERIFIED);
        when(reservationService.findById(RESERVATION_ID)).thenReturn(reservation);

        task.doTask();

        assertThat(reservation.getReservationStatus()).isEqualTo(ReservationStatus.VERIFIED);
        verify(reservationService, never()).update(any(Reservation.class));
    }

    @Test
    void failsWhenThePayloadHolderIsGone() {
        when(taskService.findPayloadHolderTaskByTargetId(TARGET_ID)).thenReturn(null);

        assertThatThrownBy(task::doTask)
                .isInstanceOf(AuthenticationException.class)
                .hasMessageContaining("expired");

        verify(reservationService, never()).findById(anyInt());
    }
}

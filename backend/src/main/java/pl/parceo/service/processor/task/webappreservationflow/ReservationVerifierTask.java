package pl.parceo.service.processor.task.webappreservationflow;

import pl.parceo.exception.AuthenticationException;
import pl.parceo.model.constant.ReservationStatus;
import pl.parceo.model.entity.Task;
import pl.parceo.service.core.ReservationService;
import pl.parceo.service.processor.TaskService;
import pl.parceo.service.processor.task.ExecutableTask;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.Optional;

@Slf4j
@RequiredArgsConstructor
public class ReservationVerifierTask implements ExecutableTask {

    private final TaskService taskService;
    private final ReservationService reservationService;
    private final Task reservationStatusVerifierTaskEntity;

    @Override
    public void doTask() {
        final var holderTaskOpt = Optional.ofNullable(
                taskService.findPayloadHolderTaskByTargetId(reservationStatusVerifierTaskEntity.getTargetId()));

        holderTaskOpt.ifPresentOrElse(this::verifyReservation, () -> {throw new AuthenticationException("Reservation expired");});
    }

    private void verifyReservation(Task task) {
        final var reservationId = objectMapper.convertValue(task.getPayload(), Integer.class);
        final var reservationToVerify = reservationService.findById(reservationId);
        if (reservationToVerify.getReservationStatus() != ReservationStatus.UNVERIFIED) {
            log.error(
                    "Unexpected scenario: Other process already verified reservation with id: {}", reservationToVerify.getId());
        } else  {
            reservationToVerify.setReservationStatus(ReservationStatus.VERIFIED);
            reservationService.update(reservationToVerify);
        }
    }
}

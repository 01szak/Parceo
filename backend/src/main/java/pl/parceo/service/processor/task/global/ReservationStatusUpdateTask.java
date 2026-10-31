package pl.parceo.service.processor.task.global;

import pl.parceo.service.core.ReservationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReservationStatusUpdateTask {

    private final ReservationService reservationService;

    @Scheduled(fixedDelayString = "${parceo.task.reservation-status-update-task.fixed-delay}")
    public void updateReservationStatus() {
        try {
            final var rowsChanged = reservationService.setActualReservationStatuses();
            if (rowsChanged > 0) {
                log.info("ReservationStatusUpdateTask successfully modified {} rows", rowsChanged);
            }
        } catch (Exception e) {
            log.error("Exception occurred while executing ReservationStatusUpdateTask changes are rolled back", e);
            throw e;
        }
    }

}

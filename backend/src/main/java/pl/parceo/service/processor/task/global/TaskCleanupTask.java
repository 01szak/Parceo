package pl.parceo.service.processor.task.global;

import pl.parceo.service.processor.TaskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskCleanupTask {

    private final TaskService taskService;

    @Scheduled(fixedDelayString = "${parceo.task.cleanup-task.fixed-delay}")
    public void cleanupTasks() {
        try {
            taskService.cleanupStalePayloadHolderTasks();
            taskService.cleanupExhaustedFailedTasks();
        } catch (Exception e) {
            log.error("Exception occurred while executing TaskCleanupTask", e);
            throw e;
        }
    }

}

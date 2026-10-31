package pl.parceo.repository;

import pl.parceo.model.constant.TaskStatus;
import pl.parceo.model.constant.TaskType;
import pl.parceo.model.entity.Task;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface TaskRepository extends CRUDRepository<Task> {

    @Query("""
        SELECT t
        FROM Task t
        WHERE (t.executionDate IS NULL OR t.executionDate <= CURRENT_TIMESTAMP)
          AND (
              t.taskStatus = 'PENDING'
              OR (t.taskStatus = 'FAILED' AND t.retryable = TRUE AND t.retryCount <= :max_retry_count)
          )
    """)
    List<Task> getExecutableTasks(@Param("max_retry_count") long maxRetryCount);

    List<Task> getAllByTaskStatus(TaskStatus taskStatus);

    List<Task> findAllByTargetIdAndTaskType(String targetId, TaskType taskType);

    /**
     * Ids of payload-holder tasks of the given camperPlaceType created at or before {@code cutoff}.
     * Rows still referenced as a parent are excluded so deleting them cannot violate the
     * FK ({@code fk_system_task_parent}); a task tree is thus removed leaf-first over
     * successive cleanup runs. (A plain SELECT may self-reference the table — a DELETE may not on MySQL.)
     */
    @Query("""
        SELECT t.id FROM Task t
        WHERE t.taskType = :type
          AND t.createdAt <= :cutoff
          AND t.id NOT IN (SELECT p.parentTask.id FROM Task p WHERE p.parentTask IS NOT NULL)
    """)
    List<Integer> findDeletableTaskIdsByType(@Param("type") TaskType type, @Param("cutoff") Date cutoff);

    /**
     * Ids of FAILED tasks that will never run again — either not retryable or with the
     * retry limit reached — created at or before {@code cutoff}. Same leaf-first FK guard
     * as {@link #findDeletableTaskIdsByType}.
     */
    @Query("""
        SELECT t.id FROM Task t
        WHERE t.taskStatus = 'FAILED'
          AND (t.retryable = FALSE OR t.retryCount >= :max_retry_count)
          AND t.createdAt <= :cutoff
          AND t.id NOT IN (SELECT p.parentTask.id FROM Task p WHERE p.parentTask IS NOT NULL)
    """)
    List<Integer> findDeletableExhaustedFailedTaskIds(@Param("max_retry_count") long maxRetryCount, @Param("cutoff") Date cutoff);
}

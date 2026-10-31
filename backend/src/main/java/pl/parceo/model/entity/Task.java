package pl.parceo.model.entity;

import pl.parceo.model.constant.TaskStatus;
import pl.parceo.model.constant.TaskType;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.jetbrains.annotations.TestOnly;
import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "system_task")
@NoArgsConstructor
public class Task extends DbObject {

    @Column(name = "target_id")
    @NotNull
    private String targetId;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payload", columnDefinition = "json")
    @Nullable
    private Object payload;
    @Column(name = "task_status")
    @Enumerated(EnumType.STRING)
    @NotNull
    private TaskStatus taskStatus = TaskStatus.PENDING;
    @Column(name = "task_type")
    @Enumerated(EnumType.STRING)
    @NotNull
    private TaskType taskType;
    @Column(name = "retryable")
    private boolean retryable;
    @Column(name = "retry_count")
    @NotNull
    private long retryCount = 0;
    @ManyToOne(fetch = FetchType.LAZY, cascade = CascadeType.DETACH)
    @JoinColumn(name = "parent_task_id")
    @Nullable
    private Task parentTask;
    @Nullable
    @Column(name = "execution_date")
    private LocalDateTime executionDate;
    @Nullable
    @Column(name = "status_message")
    private String statusMessage;

    @Builder(toBuilder = true)
    public Task(
            @Nullable String targetId,
            @Nullable Object payload,
            @Nullable TaskStatus taskStatus,
            @NonNull TaskType taskType,
            @NonNull long retryCount,
            @Nullable Task parentTask,
            @Nullable LocalDateTime executionDate
    ) {
        this.targetId = targetId;
        this.payload = payload;
        this.taskStatus = taskStatus == null ? this.taskStatus : taskStatus;
        this.taskType = taskType;
        this.retryable = taskType.isRetryable();
        this.retryCount = retryCount == 0 ? this.retryCount : retryCount;
        this.parentTask = parentTask;
        this.executionDate = executionDate;
    }

    @TestOnly
    public Task(Integer id, Task parentTask) {
        super(id);
        this.parentTask = parentTask;
    }
}

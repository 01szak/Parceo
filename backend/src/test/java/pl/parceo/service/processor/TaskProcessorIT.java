package pl.parceo.service.processor;

import pl.parceo.model.constant.TaskStatus;
import pl.parceo.model.entity.Task;
import pl.parceo.service.processor.task.ExecutableTask;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.MockedStatic;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.List;
import java.util.concurrent.Executors;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@SpringBootTest(
        classes = TaskProcessor.class,
        properties = "parceo.task.max-retry-count=5"
)
class TaskProcessorIT {

    @MockitoBean
    private TaskService taskService;

    @MockitoBean
    private ExecutableTaskFactory executableTaskFactory;

    @Autowired
    private TaskProcessor taskProcessor;

    private ExecutableTask executableTask;
    private ArgumentCaptor<Task> taskCaptor;
    private ArgumentCaptor<List<Task>> taskListCaptor;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        executableTask = mock(ExecutableTask.class);
        taskCaptor = ArgumentCaptor.forClass(Task.class);
        taskListCaptor = ArgumentCaptor.forClass(List.class);
    }

    @Test
    void shouldDoNothingWhenNoPendingTasks() {
        // given
        when(taskService.getExecutableTasks()).thenReturn(List.of());

        // when
        taskProcessor.processTasks();

        // then
        verify(taskService, never()).update(any(Task.class));
        verify(taskService, never()).update(anyList());
        verifyNoInteractions(executableTaskFactory);
    }

    @Test
    void shouldExecuteFlatTasksSuccessfully() {
        // given
        final var task1 = new Task(1, null);
        task1.setTaskStatus(TaskStatus.PENDING);

        final var task2 = new Task(2, null);
        task2.setTaskStatus(TaskStatus.PENDING);

        when(taskService.getExecutableTasks()).thenReturn(List.of(task1, task2));
        when(executableTaskFactory.getExecutableTask(any())).thenReturn(executableTask);

        // when
        taskProcessor.processTasks();

        // then
        verify(executableTask, times(2)).doTask();

        verify(taskService, times(4)).update(taskCaptor.capture());

        assertThat(task1.getTaskStatus()).isEqualTo(TaskStatus.EXECUTED);
        assertThat(task2.getTaskStatus()).isEqualTo(TaskStatus.EXECUTED);
    }

    @Test
    void shouldExecuteTaskTreeSuccessfully() {
        // given
        final var rootTask = new Task(1, null);

        final var subTask = new Task(2, rootTask);

        final var grandChildTask = new Task(3, subTask);

        when(taskService.getExecutableTasks()).thenReturn(List.of(rootTask, subTask, grandChildTask));
        when(executableTaskFactory.getExecutableTask(any())).thenReturn(executableTask);

        // when
        taskProcessor.processTasks();

        // then
        verify(executableTask, times(3)).doTask();

        verify(taskService, times(6)).update(taskCaptor.capture());

        assertThat(rootTask.getTaskStatus()).isEqualTo(TaskStatus.EXECUTED);
        assertThat(subTask.getTaskStatus()).isEqualTo(TaskStatus.EXECUTED);
        assertThat(grandChildTask.getTaskStatus()).isEqualTo(TaskStatus.EXECUTED);
    }

    @Test
    void shouldFailTaskAndMarkDescendantsAsFailedWhenExceptionThrown() {
        // given
        final var rootTask = new Task(1, null);
        rootTask.setTaskStatus(TaskStatus.PENDING);

        final var subTask = new Task(2, rootTask);
        subTask.setTaskStatus(TaskStatus.PENDING);

        when(taskService.getExecutableTasks()).thenReturn(List.of(rootTask, subTask));

        when(executableTaskFactory.getExecutableTask(rootTask)).thenThrow(new RuntimeException("Simulated business logic error"));

        // when
        taskProcessor.processTasks();

        // then
        verify(executableTaskFactory, never()).getExecutableTask(subTask);

        verify(taskService, atLeastOnce()).update(taskCaptor.capture());

        assertThat(rootTask.getTaskStatus()).isEqualTo(TaskStatus.FAILED);
        assertThat(subTask.getTaskStatus()).isEqualTo(TaskStatus.FAILED);
    }

    @Test
    void shouldIncrementRetryCountForPreviouslyFailedTasks() {
        // given
        final var failedTask = new Task(1, null);
        failedTask.setTaskStatus(TaskStatus.FAILED);
        failedTask.setRetryCount(1);

        when(taskService.getExecutableTasks()).thenReturn(List.of(failedTask));
        when(executableTaskFactory.getExecutableTask(any())).thenReturn(executableTask);

        // when
        taskProcessor.processTasks();

        // then
        assertThat(failedTask.getRetryCount()).isEqualTo(2);
        verify(executableTask, times(1)).doTask();
    }

    @Test
    void shouldFailAllInProgressTasksWhenGlobalExceptionOccurs() {
        // given
        final var pendingTask = new Task(1, null);
        pendingTask.setTaskStatus(TaskStatus.PENDING);

        final var inProgressTask = new Task(2, null);
        inProgressTask.setTaskStatus(TaskStatus.IN_PROGRESS);

        when(taskService.getExecutableTasks()).thenReturn(List.of(pendingTask));
        when(taskService.getInProgressTask()).thenReturn(List.of(inProgressTask));

        try (MockedStatic<Executors> executorsMock = mockStatic(Executors.class)) {
            executorsMock.when(Executors::newVirtualThreadPerTaskExecutor)
                    .thenThrow(new RuntimeException("Simulated runtime failure creating executor"));

            // when
            taskProcessor.processTasks();
        }

        // then
        verify(taskService).update(taskListCaptor.capture());

        final var failedList = taskListCaptor.getValue();
        assertThat(failedList.size()).isEqualTo(1);
        assertThat(failedList.getFirst().getId()).isEqualTo(2);
        assertThat(failedList.getFirst().getTaskStatus()).isEqualTo(TaskStatus.FAILED);
    }
}

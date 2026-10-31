package pl.parceo.service.processor;

import pl.parceo.model.constant.TaskStatus;
import pl.parceo.model.entity.Task;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;


class TaskGathererTest {

    private static final String FAILED_ORPHAN_TASK_MESSAGE = "No parent task available in the current task stream";

    @Test
    void shouldReturnListOfTasksWhenNoSubTasks() {
        //given
        final var tasks = List.of(new Task(1, null), new Task(2, null), new Task(3, null));

        //when
        final var result = tasks.stream().gather(TaskGatherer.createTaskForest()).toList();

        //then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(3);
        assertThat(result.getFirst()).isInstanceOf(TaskNode.class);
    }

    @Test
    void shouldReturnTreeStructureWhenSubTasks() {
        //given
        final var mainTask = new Task(1, null);
        final var subTaskA = new Task(2, mainTask);
        final var subTaskAa = new Task(3, subTaskA);
        final var subTaskAb = new Task(4, subTaskA);
        final var subTaskB = new Task(5, mainTask);

        final var tasks = List.of(mainTask, subTaskA, subTaskAa, subTaskAb, subTaskB);

        //when
        final var result = tasks.stream().gather(TaskGatherer.createTaskForest()).toList();

        //then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);

        final var task = result.getFirst();
        assertThat(task).isInstanceOf(TaskNode.class);

        final var subTasks = task.subTasks();
        assertThat(subTasks).hasSize(2);
        assertThat(subTasks.getFirst().subTasks()).hasSize(2);
        assertThat(subTasks.get(1).subTasks()).hasSize(0);
    }

    @Test
    void shouldReturnTreeStructureRegardlessOfInputOrder() {
        //given
        final var mainTask = new Task(1, null);
        final var subTaskA = new Task(2, mainTask);
        final var subTaskAa = new Task(3, subTaskA);

        // Zauważ wymieszaną kolejność: najpierw dziecko, potem wnuk, na końcu root
        final var tasks = List.of(subTaskA, subTaskAa, mainTask);

        //when
        final var result = tasks.stream().gather(TaskGatherer.createTaskForest()).toList();

        //then
        assertThat(result).hasSize(1);
        final var root = result.getFirst();
        assertThat(root.task().getId()).isEqualTo(1);
        assertThat(root.subTasks()).hasSize(1);
        assertThat(root.subTasks().getFirst().subTasks()).hasSize(1);
    }

    @Test
    void shouldReturnEmptyListWhenStreamIsEmpty() {
        //when
        final var result = Stream.<Task>empty().gather(TaskGatherer.createTaskForest()).toList();

        //then
        assertThat(result).isEmpty();
    }

    @Test
    void shouldReturnMultipleTreesWhenMultipleRootsExist() {
        //given
        final var root1 = new Task(1, null);
        final var sub1 = new Task(2, root1);

        final var root2 = new Task(3, null);
        final var sub2 = new Task(4, root2);

        final var tasks = List.of(root1, sub1, root2, sub2);

        //when
        final var result = tasks.stream().gather(TaskGatherer.createTaskForest()).toList();

        //then
        assertThat(result).hasSize(2);
        assertThat(result.get(0).subTasks()).hasSize(1);
        assertThat(result.get(1).subTasks()).hasSize(1);
    }

    @Test
    void shouldFailOrphanTasksWhenParentIsNotInStreamWithProperStatusMessage() {
        //given
        final var missingParent = new Task(99, null);
        final var orphanTask = new Task(1, missingParent);

        final var validRoot = new Task(2, null);

        final var tasks = List.of(orphanTask, validRoot);

        //when
        final var result = tasks.stream().gather(TaskGatherer.createTaskForest()).toList();

        //then
        assertThat(result).hasSize(2);

        final var failedOrphanTaskNode = result.stream().filter(taskNode ->
                TaskStatus.FAILED.equals(taskNode.task().getTaskStatus())
        ).toList();

        assertThat(failedOrphanTaskNode).hasSize(1);
        assertThat(failedOrphanTaskNode.getFirst().task().getStatusMessage()).isEqualTo(FAILED_ORPHAN_TASK_MESSAGE);
    }

    @Test
    void shouldChainFailTheChildTasksOfTheOrphanParent() {
        //given
        final var missingParent = new Task(99, null);
        final var orphanTask = new Task(1, missingParent);
        final var child1 = new Task(2, orphanTask);
        final var child2 = new Task(3, child1);

        final var tasks = List.of(child1, orphanTask, child2);

        //when
        final var result = tasks.stream().gather(TaskGatherer.createTaskForest()).toList();

        //then
        assertThat(result).hasSize(1);

        final var parent = result.getFirst();
        assertThat(parent.task().getTaskStatus()).isEqualTo(TaskStatus.FAILED);
        assertThat(parent.subTasks()).hasSize(1);

        final var subTask1 = parent.subTasks().getFirst();
        assertThat(subTask1.task().getTaskStatus()).isEqualTo(TaskStatus.FAILED);
        assertThat(subTask1.subTasks()).hasSize(1);

        final var subTask2 = subTask1.subTasks().getFirst();
        assertThat(subTask2.task().getTaskStatus()).isEqualTo(TaskStatus.FAILED);
    }

}
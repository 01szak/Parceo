package pl.parceo.service.processor.task.webappreservationflow;

import pl.parceo.BaseIT;
import pl.parceo.exception.AuthenticationException;
import pl.parceo.model.constant.ReservationStatus;
import pl.parceo.model.constant.SupportedLocale;
import pl.parceo.model.constant.TaskStatus;
import pl.parceo.model.constant.TaskType;
import pl.parceo.model.constant.UserRole;
import pl.parceo.model.dto.CamperPlaceDTO;
import pl.parceo.model.dto.CamperPlaceTypeDTO;
import pl.parceo.model.dto.GuestDTO;
import pl.parceo.model.dto.ReservationDTO;
import pl.parceo.model.dto.WebAppReservationPayload;
import pl.parceo.model.entity.CamperPlace;
import pl.parceo.model.entity.Task;
import pl.parceo.model.entity.User;
import pl.parceo.repository.ReservationRepository;
import pl.parceo.repository.TaskRepository;
import pl.parceo.service.processor.ExecutableTaskFactory;
import pl.parceo.service.util.DtoMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Exercises the web-app reservation flow task by task (init -> email -> verify) against a real
 * database. Tasks are invoked directly through {@link ExecutableTaskFactory} on the test thread so
 * the whole chain stays inside the rolled-back transaction; {@code TaskProcessor} threading itself
 * is covered by {@code TaskProcessorIT}.
 */
class WebAppReservationFlowIT extends BaseIT {

    private static final LocalDate CHECKIN = LocalDate.now().plusMonths(3);
    private static final LocalDate CHECKOUT = CHECKIN.plusDays(7);
    private static final String GUEST_EMAIL = "flow-guest@example.com";

    @Autowired
    private ExecutableTaskFactory executableTaskFactory;
    @Autowired
    private ReservationRepository reservationRepository;
    @Autowired
    private TaskRepository taskRepository;

    @MockitoBean
    private co.novu.Novu novu;

    private CamperPlace camperPlace;
    private User webAppUser;

    @BeforeEach
    void setUpFlowFixtures() {
        var type = camperPlaceTypeService.create(new CamperPlaceTypeDTO(null, "flow-camperPlaceType", BigDecimal.valueOf(120)));
        camperPlace = camperPlaceService.create(new CamperPlaceDTO(null, "901",
                DtoMapper.getCamperPlaceTypeDTO(type), null));
        webAppUser = userService.create(User.builder()
                .login("flow-web-app").username("flow-web-app").email("flow@example.com")
                .password("x").userRole(UserRole.WEB_APP).build());

        var triggerBuilder = mock(co.novu.models.operations.EventsControllerTriggerRequestBuilder.class);
        when(novu.trigger()).thenReturn(triggerBuilder);
        when(triggerBuilder.body(any())).thenReturn(triggerBuilder);
    }

    private Task runInitTask(GuestDTO guest) {
        var res = ReservationDTO.builder()
                .checkin(CHECKIN).checkout(CHECKOUT)
                .guest(guest)
                .camperPlace(DtoMapper.getCamperPlaceDto(camperPlace))
                .paid(false)
                .creator(DtoMapper.getUserDTO(webAppUser))
                .build();
        var initTask = taskRepository.save(Task.builder()
                .targetId(java.util.UUID.randomUUID().toString())
                .payload(new WebAppReservationPayload(res, SupportedLocale.pl))
                .taskType(TaskType.WEB_APP_RESERVATION_TASK)
                .build());
        executableTaskFactory.getExecutableTask(initTask).doTask();
        return initTask;
    }

    private GuestDTO newGuest() {
        return new GuestDTO(null, "Flow", "Guest", GUEST_EMAIL, "600100200", null, "PL");
    }

    private List<Task> tasksOfType(TaskType type) {
        return taskRepository.findAll().stream().filter(t -> t.getTaskType() == type).toList();
    }

    @Test
    void initTaskCreatesUnverifiedReservationWithHolderAndEmailChildren() {
        var initTask = runInitTask(newGuest());

        var reservations = reservationRepository.findAll();
        assertThat(reservations).hasSize(1);
        assertThat(reservations.getFirst().getReservationStatus()).isEqualTo(ReservationStatus.UNVERIFIED);

        var holders = tasksOfType(TaskType.TEMPORARY_PAYLOAD_HOLDER_TASK);
        assertThat(holders).hasSize(1);
        assertThat(holders.getFirst().getTaskStatus()).isEqualTo(TaskStatus.ON_HOLD);
        assertThat(holders.getFirst().getTargetId()).isEqualTo(initTask.getTargetId());

        var emails = tasksOfType(TaskType.SEND_EMAIL_AUTHENTICATION_TASK);
        assertThat(emails).hasSize(1);
        assertThat(emails.getFirst().getTargetId()).isEqualTo(initTask.getTargetId());
    }

    @Test
    void fullFlowEndsWithAVerifiedReservation() {
        var initTask = runInitTask(newGuest());

        var emailTask = tasksOfType(TaskType.SEND_EMAIL_AUTHENTICATION_TASK).getFirst();
        executableTaskFactory.getExecutableTask(emailTask).doTask();
        verify(novu.trigger()).body(any());

        var verifyTask = taskRepository.save(Task.builder()
                .targetId(initTask.getTargetId())
                .taskType(TaskType.RESERVATION_STATUS_VERIFIER_TASK)
                .build());
        executableTaskFactory.getExecutableTask(verifyTask).doTask();

        assertThat(reservationRepository.findAll().getFirst().getReservationStatus())
                .isEqualTo(ReservationStatus.VERIFIED);
    }

    @Test
    void verifierTaskFailsWhenNoHolderMatchesTheTargetId() {
        var orphanVerify = taskRepository.save(Task.builder()
                .targetId("no-such-target")
                .taskType(TaskType.RESERVATION_STATUS_VERIFIER_TASK)
                .build());

        assertThatThrownBy(() -> executableTaskFactory.getExecutableTask(orphanVerify).doTask())
                .isInstanceOf(AuthenticationException.class);
    }

    @Test
    void retryingInitForTheSameGuestAndDatesKeepsASingleReservationAndSingleHolderTask() {
        runInitTask(newGuest());
        runInitTask(newGuest());

        assertThat(reservationRepository.findAll()).hasSize(1);
        assertThat(tasksOfType(TaskType.TEMPORARY_PAYLOAD_HOLDER_TASK)).hasSize(1);
    }
}

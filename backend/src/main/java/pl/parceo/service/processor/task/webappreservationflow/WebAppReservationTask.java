package pl.parceo.service.processor.task.webappreservationflow;

import pl.parceo.exception.DateValidationException;
import pl.parceo.model.EmailData;
import pl.parceo.model.constant.Operation;
import pl.parceo.model.constant.SupportedLocale;
import pl.parceo.model.constant.TaskStatus;
import pl.parceo.model.constant.TaskType;
import pl.parceo.model.dto.GuestDTO;
import pl.parceo.model.dto.ReservationDTO;
import pl.parceo.model.dto.WebAppReservationPayload;
import pl.parceo.model.entity.Reservation;
import pl.parceo.model.entity.Task;
import pl.parceo.service.core.GuestService;
import pl.parceo.service.core.ReservationService;
import pl.parceo.service.core.SearchCriteria;
import pl.parceo.service.processor.TaskService;
import pl.parceo.service.processor.task.ExecutableTask;
import pl.parceo.service.util.DtoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.Optional;

import static pl.parceo.model.constant.ReservationStatus.UNVERIFIED;
import static pl.parceo.model.constant.TaskType.SEND_EMAIL_AUTHENTICATION_TASK;

@Slf4j
@RequiredArgsConstructor
public class WebAppReservationTask implements ExecutableTask {

    private static final String NO_RESERVATION_PAYLOAD_MESSAGE = "There is no reservation to store";
    private static final String NO_RESERVATION_CREATOR_MESSAGE = "Reservation payload does not contains any creator";

    private final ReservationService reservationService;
    private final TaskService taskService;
    private final GuestService guestService;
    private final Task webAppReservationTaskEntity;

    private record CreateReservationResult(boolean isRetry, Reservation createdReservation){}

    @Override
    public void doTask() {
        final var taskPayload = objectMapper.convertValue(webAppReservationTaskEntity.getPayload(), WebAppReservationPayload.class);
        final var reservationDTO = taskPayload.reservationDTO();
        final var locale = taskPayload.locale();

        if (reservationDTO == null) {
            failTaskWithMessage(NO_RESERVATION_PAYLOAD_MESSAGE);
            return;
        }

        final var creator = reservationDTO.creator();

        if (creator == null) {
            failTaskWithMessage(NO_RESERVATION_CREATOR_MESSAGE);
            return;
        }

        final var byEmail = SearchCriteria.builder().key("email").operation(Operation.EQUALS).value(reservationDTO.guest().email()).build();
        final var guestOpt = guestService.findBy(byEmail).stream().findFirst();
        //If the guest already exists (matched by email) we reuse that entity so the reservation
        //is linked to a persisted guest id.
        final var guest = guestOpt.isPresent() ? DtoMapper.getGuestDTO(guestService.update(guestOpt.get())) : reservationDTO.guest();
        final var modifiedReservation = reservationDTO.toBuilder().guest(guest).reservationStatus(UNVERIFIED).build();

        CreateReservationResult createReservationResult;
        try {
            createReservationResult = new CreateReservationResult(false, reservationService.create(modifiedReservation));
        } catch (DateValidationException e) {
            createReservationResult = handleRetry(guest, reservationDTO);
            if (!createReservationResult.isRetry()) {
                throw e;
            }
        }
        final var createdReservation = createReservationResult.createdReservation();
        if (!createReservationResult.isRetry()) {
            createReservationHolderTask(createdReservation.getId());
        }
        //we need to map the entity again cause we need to pass Id as well
        createEmailTask(locale, DtoMapper.getGuestDTO(createdReservation.getGuest()), DtoMapper.getReservationDto(createdReservation));
    }

    private CreateReservationResult handleRetry(GuestDTO guest, ReservationDTO reservationDTO) {
        //we check whether the guest is retrying the reservation flow
        Reservation createdReservation = null;
        var isRetry = false;

        if (guest.id() == null) {
            return new CreateReservationResult(isRetry, createdReservation);
        }

        final var optCreatedReservation = reservationService.findBy(
                SearchCriteria.builder()
                        .joinObject("guest")
                        .key("id")
                        .operation(Operation.EQUALS)
                        .value(guest.id().toString())
                        .and()
                        .key("reservationStatus")
                        .operation(Operation.EQUALS)
                        .value(UNVERIFIED.toString())
                        .and()
                        .key("checkin")
                        .operation(Operation.EQUALS)
                        .value(reservationDTO.checkin().toString())
                        .and()
                        .key("checkout")
                        .operation(Operation.EQUALS)
                        .value(reservationDTO.checkout().toString())
                        .build()
        )
        .getContent();


        if (optCreatedReservation.size() == 1) {
            createdReservation = optCreatedReservation.getFirst();
            isRetry = true;
        }

        return new CreateReservationResult(isRetry, createdReservation);
    }

    private void createReservationHolderTask(Integer createdReservationId) {
        final var optHolderTask =
                Optional.ofNullable(taskService.findPayloadHolderTaskByTargetId(webAppReservationTaskEntity.getTargetId()));
        optHolderTask.or(() -> {
            final var holderTask = Task.builder()
                    .targetId(webAppReservationTaskEntity.getTargetId())
                    .payload(createdReservationId)
                    .taskStatus(TaskStatus.ON_HOLD)
                    .taskType(TaskType.TEMPORARY_PAYLOAD_HOLDER_TASK)
                    .build();

            taskService.create(holderTask);
            return Optional.empty();
        });
    }

    private void createEmailTask(SupportedLocale locale, GuestDTO guest, ReservationDTO reservationDTO) {
        final var emailTaskEntity = Task.builder()
                .targetId(webAppReservationTaskEntity.getTargetId())
                .payload(new EmailData(locale, guest, reservationDTO))
                .taskType(SEND_EMAIL_AUTHENTICATION_TASK)
                .build();

        taskService.create(emailTaskEntity);
    }

    private void failTaskWithMessage(String message) {
        webAppReservationTaskEntity.setTaskStatus(TaskStatus.FAILED);
        webAppReservationTaskEntity.setStatusMessage(message);
    }

}


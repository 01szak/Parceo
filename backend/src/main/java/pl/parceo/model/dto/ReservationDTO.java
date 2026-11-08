package pl.parceo.model.dto;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import pl.parceo.model.constant.ReservationStatus;
import jakarta.annotation.Nullable;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

import java.time.LocalDate;

@Builder(toBuilder = true)
public record ReservationDTO(
        @Nullable Integer id,
        @NotNull LocalDate checkin,
        @NotNull LocalDate checkout,
        @NotNull GuestDTO guest,
        @NotNull CamperPlaceDTO camperPlace,
        @Nullable @Positive Double price,
        @NotNull Boolean paid,
        @Nullable ReservationStatus reservationStatus,
        @Nullable UserDTO creator,
        @Nullable @Size(max = 500) String notes
) {}

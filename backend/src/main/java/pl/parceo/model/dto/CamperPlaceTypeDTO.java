package pl.parceo.model.dto;

import jakarta.annotation.Nullable;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record CamperPlaceTypeDTO(
        @Nullable Integer id,
        @NotBlank String typeName,
        @NotNull @Positive BigDecimal price
) {}

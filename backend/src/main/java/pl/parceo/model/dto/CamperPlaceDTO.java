package pl.parceo.model.dto;

import jakarta.annotation.Nullable;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record CamperPlaceDTO(
        @Nullable Integer id,
        @Nullable String index,
        @NotNull CamperPlaceTypeDTO camperPlaceType,
        @NotNull @Positive BigDecimal price
) {}

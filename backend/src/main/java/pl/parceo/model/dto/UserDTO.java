package pl.parceo.model.dto;

import jakarta.annotation.Nullable;
import jakarta.validation.constraints.NotNull;

public record UserDTO(
        @Nullable Integer id,
        @NotNull String username,
        @NotNull String email,
        @NotNull String role
){}

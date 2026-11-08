package pl.parceo.model.dto;

import jakarta.annotation.Nullable;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record OrganisationDTO(
        @Nullable Integer id,
        @NotBlank String organisationName,
        @NotBlank String address,
        @Nullable String phoneNumber,
        @Nullable @Email String email
) {}

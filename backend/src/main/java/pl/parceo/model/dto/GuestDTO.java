package pl.parceo.model.dto;

import lombok.Builder;
import pl.parceo.service.validator.CountryIso;
import jakarta.annotation.Nullable;
import jakarta.validation.constraints.Email;


@Builder
public record GuestDTO (
    @Nullable Integer id,
    @Nullable String firstname,
    @Nullable String lastname,
    @Nullable @Email String email,
    @Nullable String phoneNumber,
    @Nullable String carRegistration,
    @Nullable @CountryIso String country
) {}

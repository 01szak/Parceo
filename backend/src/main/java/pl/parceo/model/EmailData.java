package pl.parceo.model;

import pl.parceo.model.constant.SupportedLocale;
import pl.parceo.model.dto.GuestDTO;

public record EmailData(SupportedLocale locale, GuestDTO guest, Object additionalPayload) {}

package pl.parceo.model.dto;

import pl.parceo.model.constant.SupportedLocale;

public record WebAppReservationPayload(ReservationDTO reservationDTO, SupportedLocale locale){}

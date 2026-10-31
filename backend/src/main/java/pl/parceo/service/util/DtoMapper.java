package pl.parceo.service.util;

import pl.parceo.model.dto.CamperPlaceDTO;
import pl.parceo.model.dto.CamperPlaceTypeDTO;
import pl.parceo.model.dto.GuestDTO;
import pl.parceo.model.dto.ReservationDTO;
import pl.parceo.model.dto.UserDTO;
import pl.parceo.model.entity.CamperPlace;
import pl.parceo.model.entity.CamperPlaceType;
import pl.parceo.model.entity.Guest;
import pl.parceo.model.entity.Reservation;
import pl.parceo.model.entity.User;
import jakarta.validation.constraints.NotNull;


public class DtoMapper {

    public static UserDTO getUserDTO(User u) {
        return new UserDTO(
                u.getId(),
                u.getDisplayUsername(),
                u.getEmail(),
                u.getUserRole().toString()
        );
    }

    public static CamperPlaceDTO getCamperPlaceDto(@NotNull CamperPlace c) {
        return new CamperPlaceDTO(
                c.getId(),
                c.getIndex(),
                getCamperPlaceTypeDTO(c.getCamperPlaceType()),
                c.getPrice()
        );
    }

    public static ReservationDTO getReservationDto(@NotNull Reservation r) {
        return new ReservationDTO(
                r.getId(),
                r.getCheckin(),
                r.getCheckout(),
                getGuestDTO(r.getGuest()),
                getCamperPlaceDto(r.getCamperPlace()),
                r.getPrice().doubleValue(),
                r.getPaid(),
                r.getReservationStatus(),
                r.getCreator() != null ? getUserDTO(r.getCreator()) : null
        );
    }

    public static GuestDTO getGuestDTO(@NotNull Guest g) {
        return new GuestDTO(
                g.getId(),
                g.getFirstname(),
                g.getLastname(),
                g.getEmail(),
                g.getPhoneNumber(),
                g.getCarRegistration(),
                g.getCountry()
        );
    }

    public static CamperPlaceTypeDTO getCamperPlaceTypeDTO(@NotNull CamperPlaceType cpt) {
        return new CamperPlaceTypeDTO(
            cpt.getId(),
            cpt.getTypeName(),
            cpt.getPrice()
        );
    }

}
package pl.parceo.service.core;

import pl.parceo.exception.UserInputException;
import pl.parceo.model.dto.GuestDTO;
import pl.parceo.model.entity.Guest;
import pl.parceo.repository.CRUDRepository;
import pl.parceo.repository.GuestRepository;
import pl.parceo.service.core.StatisticsService.StatisticsModel;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class GuestService extends CRUDServiceImpl<Guest> {

    private final GuestRepository guestRepository;

    public Guest create(GuestDTO guestDTO) {
        checkIsEmpty(guestDTO);

        return super.create(Guest.builder()
                .firstname(guestDTO.firstname())
                .lastname(guestDTO.lastname())
                .email(mapBlankToNull(guestDTO.email()))
                .carRegistration(guestDTO.carRegistration())
                .phoneNumber(guestDTO.phoneNumber())
                .country(guestDTO.country())
                .build()
        );
    }

    public Guest update(GuestDTO guestDTO) {
        if (guestDTO.id() == null) {
            return create(guestDTO);
        }

        var guest = findById(guestDTO.id());

        guest.setFirstname(guestDTO.firstname());
        guest.setLastname(guestDTO.lastname());
        guest.setEmail(mapBlankToNull(guestDTO.email()));
        guest.setPhoneNumber(guestDTO.phoneNumber());
        guest.setCarRegistration(guestDTO.carRegistration());
        guest.setCountry(guestDTO.country());

        return super.update(guest);
    }

    private String mapBlankToNull(String email) {
        return email == null || email.isBlank() ? null : email;
    }

    private void checkIsEmpty(GuestDTO guestDTO) {
        var guestIsEmpty = Stream.of(
                guestDTO.firstname(),
                guestDTO.lastname(),
                guestDTO.phoneNumber(),
                guestDTO.email(),
                guestDTO.carRegistration()
        ).allMatch(v -> v == null || v.isBlank());

        if (guestIsEmpty) {
            throw new UserInputException("Utwórz lub podaj istniejącego gościa");
        }
    }

    public List<StatisticsModel.CountryDistribution> getCountryDistribution(int month, int year) {
        return guestRepository.getCountryDistribution(month, year);
    }

    @Override
    protected CRUDRepository<Guest> getRepository() {
        return guestRepository;
    }
}


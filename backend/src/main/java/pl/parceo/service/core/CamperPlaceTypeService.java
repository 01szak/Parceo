package pl.parceo.service.core;

import pl.parceo.exception.UserInputException;
import pl.parceo.model.dto.CamperPlaceTypeDTO;
import pl.parceo.model.entity.CamperPlace;
import pl.parceo.model.entity.CamperPlaceType;
import pl.parceo.repository.CRUDRepository;
import pl.parceo.repository.CamperPlaceTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class CamperPlaceTypeService extends CRUDServiceImpl<CamperPlaceType>{

    private final CamperPlaceTypeRepository camperPlaceTypeRepository;

    public List<CamperPlaceType> update(
            List<CamperPlaceTypeDTO> camperPlaceTypeDTOs,
            List<Integer> cpIdToOverride
    ) {
        validatePayload(camperPlaceTypeDTOs);
        var cpTypesToUpdate = new ArrayList<CamperPlaceType>();
        for (var dto : camperPlaceTypeDTOs) {
            if (dto.id() == null) {
                cpTypesToUpdate.add(create(dto));
                continue;
            }

            var cpType = findById(dto.id());
            var cps = cpType.getCamperPlaces();

            if (cpIdToOverride != null && !cps.isEmpty()) overrideSelectedCamperPlaces(cpIdToOverride, cps);

            cpType.setTypeName(dto.typeName());
            cpType.setPrice(dto.price());
            cpTypesToUpdate.add(cpType);
        }

        return super.update(cpTypesToUpdate);
    }

    private void validatePayload(List<CamperPlaceTypeDTO> camperPlaceTypeDTOs) {
        var illegalCpt = camperPlaceTypeDTOs.stream().filter(c -> c.id() == null);
        if (illegalCpt.count() > 0) {
            throw new IllegalStateException("camperPlaceType with null id! " + illegalCpt);
        }
    }

    private void overrideSelectedCamperPlaces(List<Integer> cpIdToOverride, List<CamperPlace> cps) {
            cps.stream()
                    .filter(c -> cpIdToOverride.contains(c.getId()))
                    .forEach(c -> c.setPrice(null));
    }

    public CamperPlaceType create(CamperPlaceTypeDTO camperPlaceTypeDTO) {
        return super.create(new CamperPlaceType(camperPlaceTypeDTO.typeName(), camperPlaceTypeDTO.price()));
    }

    @Override
    public void deleteById(int id) {
        var cpType = super.findById(id);
        if (!cpType.getCamperPlaces().isEmpty()) {
            throw new UserInputException("Nie można usunąć typu parceli do którego są przypisane parcele! Przypisz parcele do innego typu następnie spróbuj ponownie");
        }
        super.deleteById(id);
    }

    @Override
    protected CRUDRepository<CamperPlaceType> getRepository() {
        return camperPlaceTypeRepository;
    }
}

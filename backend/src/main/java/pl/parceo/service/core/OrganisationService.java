package pl.parceo.service.core;

import pl.parceo.model.entity.Organisation;
import pl.parceo.repository.CRUDRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OrganisationService extends CRUDServiceImpl<Organisation> {

    private final OrganisationRepository organisationRepository;

    @Override
    protected CRUDRepository<Organisation> getRepository() {
        return organisationRepository;
    }

}

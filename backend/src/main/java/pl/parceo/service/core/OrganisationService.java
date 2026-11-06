package pl.parceo.service.core;

import pl.parceo.model.entity.Organisation;
import pl.parceo.repository.CRUDRepository;
import pl.parceo.repository.OrganisationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OrganisationService extends CRUDServiceImpl<Organisation> {

    private final OrganisationRepository organisationRepository;
    private final UserService userService;

    /**
     * @return the organization of the user who sent the current request
     */
    public Organisation findLoggedInUserOrganisation() {
        final var organisation = userService.getLoggedInUser().getOrganisation();
        if (organisation == null) {
            throw new IllegalStateException("Logged in user is not assigned to any organisation");
        }
        return findById(organisation.getId());
    }

    @Override
    protected CRUDRepository<Organisation> getRepository() {
        return organisationRepository;
    }

}

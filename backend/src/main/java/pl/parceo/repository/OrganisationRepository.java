package pl.parceo.repository;

import pl.parceo.model.entity.Organisation;
import org.springframework.stereotype.Repository;

@Repository
public interface OrganisationRepository extends CRUDRepository<Organisation> {}

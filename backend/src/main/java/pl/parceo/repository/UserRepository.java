package pl.parceo.repository;

import pl.parceo.model.constant.UserRole;
import pl.parceo.model.entity.User;

import java.util.Optional;

public interface UserRepository extends CRUDRepository<User> {

    Optional<User> findByLogin(String login);

    Optional<User> findFirstByOrganisation_IdAndUserRole(Integer organisationId, UserRole userRole);

}

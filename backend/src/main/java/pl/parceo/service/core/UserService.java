package pl.parceo.service.core;

import pl.parceo.model.constant.UserRole;
import pl.parceo.model.entity.User;
import pl.parceo.repository.CRUDRepository;
import pl.parceo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService extends CRUDServiceImpl<User> implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String login) throws UsernameNotFoundException {
        var user = userRepository.findByLogin(login);

        if (user.isEmpty()) {
            throw new UsernameNotFoundException("Użytkownik z podanymi danymi nie istnieje");
        }

        return user.get();
    }

    public Optional<User> findWebAppUser(int organisationId) {
        return userRepository.findFirstByOrganisation_IdAndUserRole(organisationId, UserRole.WEB_APP);
    }

    @Override
    protected CRUDRepository<User> getRepository() {
        return userRepository;
    }
}

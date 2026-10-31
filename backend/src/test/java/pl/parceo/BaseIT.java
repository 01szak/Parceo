package pl.parceo;

import pl.parceo.helper.AuthenticationHelper;
import pl.parceo.model.constant.Country;
import pl.parceo.model.constant.ReservationStatus;
import pl.parceo.model.constant.UserRole;
import pl.parceo.model.dto.CamperPlaceDTO;
import pl.parceo.model.dto.CamperPlaceTypeDTO;
import pl.parceo.model.dto.GuestDTO;
import pl.parceo.model.dto.ReservationDTO;
import pl.parceo.model.entity.CamperPlace;
import pl.parceo.model.entity.CamperPlaceType;
import pl.parceo.model.entity.Guest;
import pl.parceo.model.entity.Reservation;
import pl.parceo.model.entity.User;
import pl.parceo.service.core.CamperPlaceService;
import pl.parceo.service.core.CamperPlaceTypeService;
import pl.parceo.service.core.GuestService;
import pl.parceo.service.core.ReservationService;
import pl.parceo.service.core.StatisticsService;
import pl.parceo.service.core.UserService;
import pl.parceo.service.processor.TaskService;
import pl.parceo.service.util.DtoMapper;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Date;

import static pl.parceo.helper.AuthenticationHelper.IT_USER_LOGIN;
import static org.assertj.core.api.AssertionsForClassTypes.assertThat;

@SpringBootTest(classes = ParceoApplication.class)
@Transactional
public abstract class BaseIT extends AbstractMySqlContainerTest {

    @Autowired
    protected ReservationService reservationService;
    @Autowired
    protected GuestService guestService;
    @Autowired
    protected CamperPlaceService camperPlaceService;
    @Autowired
    protected CamperPlaceTypeService camperPlaceTypeService;
    @Autowired
    protected StatisticsService statisticsService;
    @Autowired
    protected TaskService taskService;
    @Autowired
    protected UserService userService;

    private static long eachTestStart;
    private static long testStart;

    @BeforeAll
    public static void beforeAll() {
        testStart = new Date().getTime();
    }

    @AfterAll
    public static void afterAll() {
        var testTime = (new Date().getTime() - testStart);
        System.out.printf("\nTOOK OVERALL: %s ms\n", testTime);
    }

    @BeforeEach
    public void before() {
        eachTestStart = new Date().getTime();
        System.out.println("\n-----------< TEST START >-----------");

        final var testUser = userService.create(User.builder()
                .login(IT_USER_LOGIN)
                .username(IT_USER_LOGIN)
                .email("it_test_user@example.com")
                .password("testPassword")
                .userRole(UserRole.ADMIN)
                .build()
        );
        AuthenticationHelper.authenticateUser(testUser);
    }

    @AfterEach
    public void after() {
        var testTime = (new Date().getTime() - eachTestStart);
        System.out.println("\n-----------< TEST END >-----------");
        System.out.printf("TOOK: %s ms", testTime);
    }

    @Test
    public void isContainerRunning() {
        assertThat(MY_SQL.isRunning()).isTrue();
    }

    protected Reservation createReservationWithNewData(
            String cpTypeName,
            BigDecimal cpTypePrice,
            String camperPlaceIndex,
            String guestFirstName,
            String guestLastName,
            Country country,
            LocalDate checkin,
            LocalDate checkout,
            boolean paid
    ) {
        var cpType = createCpType(cpTypeName, cpTypePrice);
        var cp = createCamperPlace(camperPlaceIndex, cpType);
        var guest = createGuest(guestFirstName, guestLastName, country);
        return createReservation(cp, checkin, checkout, guest, paid);
    }

    protected Reservation createReservation(
            CamperPlace camperPlace,
            LocalDate checkin,
            LocalDate checkout,
            Guest guest,
            boolean paid
    ) {
        return reservationService.create(
                 ReservationDTO.builder()
                         .checkin(checkin)
                         .checkout(checkout)
                         .guest(DtoMapper.getGuestDTO(guest))
                         .camperPlace(DtoMapper.getCamperPlaceDto(camperPlace))
                         .paid(paid)
                         .reservationStatus(ReservationStatus.COMING)
                         .build()
        );
    }

    protected Guest createGuest(String guestFirstName, String guestLastName, Country country) {
        return guestService.create(
                new GuestDTO(
                        null,
                        guestFirstName,
                        guestLastName,
                        null,
                        null,
                        null,
                        country.getIsoCode()
                )
        );
    }

    protected CamperPlace createCamperPlace(String camperPlaceIndex, CamperPlaceType cpType) {
        return camperPlaceService.create(
                new CamperPlaceDTO(
                        null,
                        camperPlaceIndex,
                        DtoMapper.getCamperPlaceTypeDTO(cpType),
                        null
                )
        );
    }

    protected CamperPlaceType createCpType(String typeName, BigDecimal cpTypePrice) {
        return camperPlaceTypeService.create(new CamperPlaceTypeDTO(null, typeName, cpTypePrice));
    }

}

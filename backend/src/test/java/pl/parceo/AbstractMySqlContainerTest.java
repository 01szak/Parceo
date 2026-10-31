package pl.parceo;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mysql.MySQLContainer;

import java.util.Date;

/**
 * Base for every test that needs a real MySQL: starts a single Testcontainers instance shared by the
 * whole suite (both the {@code MOCK} slice used by {@link BaseIT} and the {@code RANDOM_PORT} server
 * used by {@link BaseE2E}) and points the datasource at it. Holds no Spring context of its own so the
 * two {@code @SpringBootTest} flavours keep their separate context caches.
 */
@ActiveProfiles("test")
@Testcontainers
public abstract class AbstractMySqlContainerTest {

    protected static final MySQLContainer MY_SQL = new MySQLContainer("mysql:8.0.32")
            .withDatabaseName("camper_park_sf_test")
            .withUsername("root")
            .withPassword("qwer");


    private static long eachTestStart;
    private static long testStart;

    static {
        MY_SQL.start();
    }

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MY_SQL::getJdbcUrl);
        registry.add("spring.datasource.username", MY_SQL::getUsername);
        registry.add("spring.datasource.password", MY_SQL::getPassword);
    }

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
    }

    @AfterEach
    public void after() {
        var testTime = (new Date().getTime() - eachTestStart);
        System.out.println("\n-----------< TEST END >-----------");
        System.out.printf("TOOK: %s ms", testTime);
    }

}

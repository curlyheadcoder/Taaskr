package com.taaskr;

import com.taaskr.dto.ai.AiDiagnosticRequest;
import com.taaskr.dto.ai.AiDiagnosticResponse;
import com.taaskr.entity.Service;
import com.taaskr.entity.ServiceCategory;
import com.taaskr.repository.ServiceCategoryRepository;
import com.taaskr.repository.ServiceRepository;
import com.taaskr.service.AiDiagnosticService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class AiDiagnosticTests {

    @Autowired
    private ServiceCategoryRepository serviceCategoryRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private AiDiagnosticService aiDiagnosticService;

    private Service plumbingService;
    private Service acService;
    private Service electricService;

    @BeforeEach
    void setUp() {
        ServiceCategory plumbingCat = new ServiceCategory();
        plumbingCat.setName("Plumbing");
        plumbingCat.setDescription("Plumbing Services");
        plumbingCat.setActive(true);
        plumbingCat = serviceCategoryRepository.save(plumbingCat);

        ServiceCategory acCat = new ServiceCategory();
        acCat.setName("AC Repair & Service");
        acCat.setDescription("AC Cooling solutions");
        acCat.setActive(true);
        acCat = serviceCategoryRepository.save(acCat);

        ServiceCategory electricCat = new ServiceCategory();
        electricCat.setName("Electrician");
        electricCat.setDescription("Electrical wiring and repair");
        electricCat.setActive(true);
        electricCat = serviceCategoryRepository.save(electricCat);

        plumbingService = new Service();
        plumbingService.setName("Water Pipe Leakage Repair");
        plumbingService.setCategory(plumbingCat);
        plumbingService.setPrice(BigDecimal.valueOf(499));
        plumbingService.setDurationMinutes(60);
        plumbingService.setActive(true);
        plumbingService = serviceRepository.save(plumbingService);

        acService = new Service();
        acService.setName("AC Gas Refill & Cooling Fix");
        acService.setCategory(acCat);
        acService.setPrice(BigDecimal.valueOf(1499));
        acService.setDurationMinutes(90);
        acService.setActive(true);
        acService = serviceRepository.save(acService);

        electricService = new Service();
        electricService.setName("Switchboard Spark & Short Circuit");
        electricService.setCategory(electricCat);
        electricService.setPrice(BigDecimal.valueOf(349));
        electricService.setDurationMinutes(45);
        electricService.setActive(true);
        electricService = serviceRepository.save(electricService);
    }

    @Test
    void testPlumbingDiagnosis() {
        AiDiagnosticResponse res = aiDiagnosticService.diagnoseIssue(new AiDiagnosticRequest("My kitchen sink pipe is leaking water all over the floor"));
        assertNotNull(res);
        assertEquals(plumbingService.getId(), res.getServiceId());
        assertEquals("Plumbing", res.getCategoryName());
        assertNotNull(res.getReason());
    }

    @Test
    void testAcDiagnosis() {
        AiDiagnosticResponse res = aiDiagnosticService.diagnoseIssue(new AiDiagnosticRequest("My AC is blowing warm air and not cooling the bedroom"));
        assertNotNull(res);
        assertEquals(acService.getId(), res.getServiceId());
        assertEquals("AC Repair & Service", res.getCategoryName());
    }

    @Test
    void testElectricalEmergencyDiagnosis() {
        AiDiagnosticResponse res = aiDiagnosticService.diagnoseIssue(new AiDiagnosticRequest("Switchboard is sparking and there is burning smoke smell"));
        assertNotNull(res);
        assertEquals(electricService.getId(), res.getServiceId());
        assertEquals("EMERGENCY", res.getUrgency());
    }
}

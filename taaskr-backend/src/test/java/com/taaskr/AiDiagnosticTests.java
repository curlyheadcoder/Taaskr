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
    private Service acRepairService;
    private Service acInstallService;
    private Service acMaintenanceService;
    private Service electricService;

    @BeforeEach
    void setUp() {
        ServiceCategory plumbingCat = new ServiceCategory();
        plumbingCat.setName("Plumbing");
        plumbingCat.setDescription("Plumbing Services");
        plumbingCat.setActive(true);
        plumbingCat = serviceCategoryRepository.save(plumbingCat);

        ServiceCategory appliancesCat = new ServiceCategory();
        appliancesCat.setName("Appliances");
        appliancesCat.setDescription("Appliances solutions");
        appliancesCat.setActive(true);
        appliancesCat = serviceCategoryRepository.save(appliancesCat);

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

        acInstallService = new Service();
        acInstallService.setName("AC Installation");
        acInstallService.setCategory(appliancesCat);
        acInstallService.setPrice(BigDecimal.valueOf(1499));
        acInstallService.setDurationMinutes(180);
        acInstallService.setActive(true);
        acInstallService = serviceRepository.save(acInstallService);

        acRepairService = new Service();
        acRepairService.setName("AC Repair");
        acRepairService.setCategory(appliancesCat);
        acRepairService.setPrice(BigDecimal.valueOf(699));
        acRepairService.setDurationMinutes(120);
        acRepairService.setActive(true);
        acRepairService = serviceRepository.save(acRepairService);

        acMaintenanceService = new Service();
        acMaintenanceService.setName("AC Maintenance");
        acMaintenanceService.setCategory(appliancesCat);
        acMaintenanceService.setPrice(BigDecimal.valueOf(599));
        acMaintenanceService.setDurationMinutes(90);
        acMaintenanceService.setActive(true);
        acMaintenanceService = serviceRepository.save(acMaintenanceService);

        electricService = new Service();
        electricService.setName("Switchboard Spark & Short Circuit");
        electricService.setCategory(electricCat);
        electricService.setPrice(BigDecimal.valueOf(349));
        electricService.setDurationMinutes(45);
        electricService.setActive(true);
        electricService = serviceRepository.save(electricService);
    }

    @Test
    void testAcRepairNotWorkingDisambiguation() {
        AiDiagnosticResponse res = aiDiagnosticService.diagnoseIssue(new AiDiagnosticRequest("AC is not working"));
        assertNotNull(res);
        assertEquals(acRepairService.getId(), res.getServiceId(), "Should pick AC Repair, not AC Installation");
        assertEquals("AC Repair", res.getServiceName());
    }

    @Test
    void testAcInstallationDisambiguation() {
        AiDiagnosticResponse res = aiDiagnosticService.diagnoseIssue(new AiDiagnosticRequest("Want to install new AC in living room"));
        assertNotNull(res);
        assertEquals(acInstallService.getId(), res.getServiceId(), "Should pick AC Installation");
    }

    @Test
    void testAcMaintenanceDisambiguation() {
        AiDiagnosticResponse res = aiDiagnosticService.diagnoseIssue(new AiDiagnosticRequest("Routine AC servicing and filter cleaning"));
        assertNotNull(res);
        assertEquals(acMaintenanceService.getId(), res.getServiceId(), "Should pick AC Maintenance");
    }

    @Test
    void testPlumbingDiagnosis() {
        AiDiagnosticResponse res = aiDiagnosticService.diagnoseIssue(new AiDiagnosticRequest("My kitchen sink pipe is leaking water all over the floor"));
        assertNotNull(res);
        assertEquals(plumbingService.getId(), res.getServiceId());
        assertEquals("Plumbing", res.getCategoryName());
    }

    @Test
    void testElectricalEmergencyDiagnosis() {
        AiDiagnosticResponse res = aiDiagnosticService.diagnoseIssue(new AiDiagnosticRequest("Switchboard is sparking and there is burning smoke smell"));
        assertNotNull(res);
        assertEquals(electricService.getId(), res.getServiceId());
        assertEquals("EMERGENCY", res.getUrgency());
    }

    @Test
    void testParcelTransportDiagnosis() {
        ServiceCategory vehicleCat = new ServiceCategory();
        vehicleCat.setName("On-Demand Vehicle");
        vehicleCat.setDescription("Vehicle Transport");
        vehicleCat.setActive(true);
        vehicleCat = serviceCategoryRepository.save(vehicleCat);

        Service courierService = new Service();
        courierService.setName("Electric Bike (Courier)");
        courierService.setCategory(vehicleCat);
        courierService.setPrice(BigDecimal.valueOf(99));
        courierService.setDurationMinutes(30);
        courierService.setActive(true);
        courierService = serviceRepository.save(courierService);

        AiDiagnosticResponse res = aiDiagnosticService.diagnoseIssue(new AiDiagnosticRequest("I want to send my parcel to office"));
        assertNotNull(res);
        assertEquals(courierService.getId(), res.getServiceId(), "Should pick Electric Bike (Courier) for parcel queries");
        assertEquals("On-Demand Vehicle", res.getCategoryName());
    }

    @Test
    void testChatParcelQueryReturnsRealVehicleServices() {
        ServiceCategory vehicleCat = new ServiceCategory();
        vehicleCat.setName("On-Demand Vehicle");
        vehicleCat.setDescription("Vehicle Transport");
        vehicleCat.setActive(true);
        vehicleCat = serviceCategoryRepository.save(vehicleCat);

        Service courier = new Service();
        courier.setName("Electric Bike (Courier)");
        courier.setCategory(vehicleCat);
        courier.setPrice(BigDecimal.valueOf(99));
        courier.setDurationMinutes(30);
        courier.setActive(true);
        serviceRepository.save(courier);

        com.taaskr.dto.ai.AiChatRequest chatReq = new com.taaskr.dto.ai.AiChatRequest("I want to send my parcel across the city");
        com.taaskr.dto.ai.AiChatResponse chatRes = aiDiagnosticService.chat(null, chatReq);

        assertNotNull(chatRes);
        assertNotNull(chatRes.getServices());
        assertFalse(chatRes.getServices().isEmpty(), "Should return real matching vehicle services");
        assertEquals("Electric Bike (Courier)", chatRes.getServices().get(0).getName());
        assertTrue(chatRes.getReply().contains("Electric Bike") || chatRes.getReply().contains("parcel") || chatRes.getReply().contains("Vehicle"), 
                "Reply should reference actual logistics service, not construction materials");
    }

    @Test
    void testChatUnsupportedServiceQuery() {
        com.taaskr.dto.ai.AiChatRequest chatReq = new com.taaskr.dto.ai.AiChatRequest("Can you repair my space rocket or supersonic jet engine?");
        com.taaskr.dto.ai.AiChatResponse chatRes = aiDiagnosticService.chat(null, chatReq);

        assertNotNull(chatRes);
        assertEquals("UNSUPPORTED", chatRes.getIntent());
        assertTrue(chatRes.getReply().toLowerCase().contains("do not offer") || chatRes.getReply().toLowerCase().contains("don't currently offer"), 
                "Should honestly state service is unsupported");
    }
}


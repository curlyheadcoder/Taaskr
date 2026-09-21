import { runTrackingHardeningSuite } from '../utils/runTrackingTests';

// Execute the test suite
runTrackingHardeningSuite().then((results) => {
  console.log(`\n========================================`);
  console.log(`TASK 10 HARDENING TEST RESULTS: ${results.passed}/${results.total} PASSED`);
  console.log(`========================================\n`);
});

import prisma from '../src/server/models/prisma';
import { aiService } from '../src/server/services/aiService';
import { meshService, MeshService } from '../src/server/services/meshService';

async function runTests() {
  console.log('🧪 Starting AAPDA MATRIX Automated Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // Test 1: Local Fallback Classifier for Critical Medical
    console.log('1. Testing AI Engine Local Fallback...');
    const medicalResult = aiService.localFallbackClassifier(
      'My father has chest pain and is having difficulty breathing.'
    );
    assert(medicalResult.category === 'MEDICAL_EMERGENCY', 'Identifies chest pain as MEDICAL_EMERGENCY');
    assert(medicalResult.priority === 'CRITICAL', 'Assigns CRITICAL priority to breathing distress');
    assert(medicalResult.suggestedEmergencyNumber === '108', 'Recommends 108 Ambulance');
    assert(medicalResult.isFallback === true, 'Flags as local fallback');

    // Test 2: Local Fallback Classifier for Fire
    const fireResult = aiService.localFallbackClassifier('There is a fire in my kitchen.');
    assert(fireResult.category === 'FIRE_EMERGENCY', 'Identifies kitchen fire as FIRE_EMERGENCY');
    assert(fireResult.suggestedEmergencyNumber === '101', 'Recommends 101 Fire brigade');

    // Test 3: Local Fallback Classifier for Landslide
    const landslideResult = aiService.localFallbackClassifier('Major landslide blocked the road with debris');
    assert(landslideResult.disasterSubtype === 'LANDSLIDE', 'Identifies landslide subtype');
    assert(landslideResult.priority === 'CRITICAL', 'Assigns CRITICAL priority to landslide');

    // Test 4: Database Connection & Emergency Contacts Query
    console.log('\n2. Testing Database Models & Seed Data...');
    const contacts = await prisma.emergencyContact.findMany();
    assert(contacts.length >= 5, `Database contains ${contacts.length} verified emergency contacts`);
    const has112 = contacts.some((c) => c.telephoneNumber === '112');
    assert(has112, 'National 112 Unified helpline is present in verified contacts');

    // Test 5: Incident Creation & Verification
    console.log('\n3. Testing Incident Creation & Retrieval...');
    const testId = `TEST_SOS_${Date.now().toString().slice(-6)}`;
    const created = await prisma.incident.create({
      data: {
        id: testId,
        emergencyCategory: 'ROAD_ACCIDENT',
        priority: 'HIGH',
        description: 'Multi-vehicle collision on bypass highway',
        latitude: 28.5355,
        longitude: 77.391,
        locationAccuracy: 15.0,
        batteryLevel: 75,
        status: 'PENDING',
        deliveryStatus: 'DELIVERED_SERVER',
        acknowledgementReceived: true,
      },
    });
    assert(created.id === testId, `Successfully created incident with ID ${testId}`);

    const retrieved = await prisma.incident.findUnique({
      where: { id: testId },
    });
    assert(retrieved !== null && retrieved.description === 'Multi-vehicle collision on bypass highway', 'Retrieved persisted incident matches created data');

    // Test 6: Status Update & History Tracking
    const updated = await prisma.incident.update({
      where: { id: testId },
      data: {
        status: 'DISPATCHED',
        history: {
          create: {
            previousStatus: 'PENDING',
            newStatus: 'DISPATCHED',
            changedBy: 'Test Runner',
            notes: 'Test dispatch execution',
          },
        },
      },
      include: { history: true },
    });
    assert(updated.status === 'DISPATCHED', 'Updated incident status to DISPATCHED');
    assert(updated.history.length > 0, 'Incident history audit trail recorded');

    // Test 7: Mesh Packet Generation & Integrity Verification
    console.log('\n4. Testing Store-and-Forward Mesh Protocol...');
    const packet = MeshService.generatePacket(testId, 'DEV_TEST_PHONE_01', {
      category: 'ROAD_ACCIDENT',
      priority: 'HIGH',
      lat: 28.5355,
    });
    assert(packet.messageId.startsWith('MSG_'), 'Mesh packet generated with unique ID');
    assert(meshService.verifyChecksum(packet), 'Mesh packet checksum verifies integrity');

    // Clean up test incident
    await prisma.incident.delete({ where: { id: testId } });
    console.log('\n✓ Test incident cleaned up.');

    console.log(`\n=================================================`);
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`=================================================`);

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();

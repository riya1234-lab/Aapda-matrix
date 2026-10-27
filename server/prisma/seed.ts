import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding AAPDA MATRIX Database...');

  // 1. Seed Emergency Contacts
  const contacts = [
    {
      serviceName: 'National Emergency Helpline (Unified 112)',
      region: 'National',
      telephoneNumber: '112',
      category: 'GENERAL',
      priorityOrder: 1,
    },
    {
      serviceName: 'Emergency Medical Services & Ambulance (108)',
      region: 'National',
      telephoneNumber: '108',
      category: 'AMBULANCE',
      priorityOrder: 2,
    },
    {
      serviceName: 'Police Emergency Direct (100)',
      region: 'National',
      telephoneNumber: '100',
      category: 'POLICE',
      priorityOrder: 3,
    },
    {
      serviceName: 'Fire and Rescue Services (101)',
      region: 'National',
      telephoneNumber: '101',
      category: 'FIRE',
      priorityOrder: 4,
    },
    {
      serviceName: 'Women Helpline (Domestic & Public Safety 1091)',
      region: 'National',
      telephoneNumber: '1091',
      category: 'WOMEN',
      priorityOrder: 5,
    },
    {
      serviceName: 'National Disaster Management Authority (NDMA 1070)',
      region: 'National',
      telephoneNumber: '1070',
      category: 'DISASTER',
      priorityOrder: 6,
    },
    {
      serviceName: 'State Emergency Operation Center (SEOC 1077)',
      region: 'State',
      telephoneNumber: '1077',
      category: 'DISASTER',
      priorityOrder: 7,
    },
  ];

  for (const c of contacts) {
    await prisma.emergencyContact.upsert({
      where: { id: `contact_${c.telephoneNumber}` },
      update: {},
      create: {
        id: `contact_${c.telephoneNumber}`,
        ...c,
        verifiedAt: new Date(),
        active: true,
      },
    });
  }
  console.log('✓ Emergency Contacts seeded.');

  // 2. Seed Response Teams
  const teams = [
    {
      id: 'team_sar_alpha',
      teamName: 'NDRF 8th Bn Alpha Quick Reaction SAR',
      serviceType: 'SAR',
      availabilityStatus: 'AVAILABLE',
      contactNumber: '+91-11-24363260',
      baseLocation: 'Sector 19, Ghaziabad Ops Base',
    },
    {
      id: 'team_med_bravo',
      teamName: '108 Rapid Trauma Resuscitation Unit 4',
      serviceType: 'MEDICAL',
      availabilityStatus: 'AVAILABLE',
      contactNumber: '+91-9876543210',
      baseLocation: 'AIIMS Emergency Wing Staging Area',
    },
    {
      id: 'team_fire_hazard',
      teamName: 'HazMat & Heavy Collapse Rescue Unit 12',
      serviceType: 'FIRE',
      availabilityStatus: 'AVAILABLE',
      contactNumber: '+91-11-23412222',
      baseLocation: 'Central Fire Command HQ',
    },
    {
      id: 'team_police_qrf',
      teamName: 'Civil Defense Special Emergency Force Delta',
      serviceType: 'CIVIL_DEFENSE',
      availabilityStatus: 'AVAILABLE',
      contactNumber: '+91-11-23315555',
      baseLocation: 'Regional Disaster Coordination Center',
    },
  ];

  for (const t of teams) {
    await prisma.responseTeam.upsert({
      where: { id: t.id },
      update: {},
      create: t,
    });
  }
  console.log('✓ Response Teams seeded.');

  // 3. Seed Demo Users
  const passwordHash = await bcrypt.hash('commander123', 10);
  const commanderUser = await prisma.user.upsert({
    where: { email: 'commander@aapdamatrix.org' },
    update: {},
    create: {
      displayName: 'Commander Rajesh Sharma',
      email: 'commander@aapdamatrix.org',
      passwordHash,
      role: 'COMMANDER',
      phoneNumber: '+91-9811223344',
      bloodGroup: 'O+',
    },
  });

  const citizenUser = await prisma.user.upsert({
    where: { email: 'citizen@example.com' },
    update: {},
    create: {
      displayName: 'Aarav Patel',
      email: 'citizen@example.com',
      passwordHash,
      role: 'CITIZEN',
      phoneNumber: '+91-9899112233',
      bloodGroup: 'B+',
      allergies: 'Penicillin',
      emergencyContactName: 'Sunita Patel (Mother)',
      emergencyContactPhone: '+91-9899112299',
    },
  });
  console.log('✓ Users seeded.');

  // 4. Seed Initial Incidents (Matching Reference Screenshots)
  const initialIncidents = [
    {
      id: 'SOS_8F3A29',
      userId: citizenUser.id,
      emergencyCategory: 'NATURAL_DISASTER',
      disasterSubtype: 'LANDSLIDE',
      priority: 'CRITICAL',
      description: 'Major landslide on Highway 5 near Shimla. Road blocked by heavy debris, 4 people stranded in car.',
      latitude: 31.1048,
      longitude: 77.1734,
      locationAccuracy: 12.5,
      locationProtocol: 'GPS',
      batteryLevel: 4,
      status: 'PENDING',
      communicationMethod: 'BLE_MESH',
      deliveryStatus: 'DELIVERED_SERVER',
      acknowledgementReceived: true,
      hopCount: 2,
      responseTeamId: 'team_sar_alpha',
      operatorNotes: 'Target vehicles located via drone feed. NDRF team mobilized.',
    },
    {
      id: 'SOS_99B1C2',
      anonymousId: 'ANON_RISHIKESH_01',
      emergencyCategory: 'NATURAL_DISASTER',
      disasterSubtype: 'FLOOD',
      priority: 'HIGH',
      description: 'Rapid flash flood in river stream near footbridge. Water level rising fast.',
      latitude: 30.0869,
      longitude: 78.2676,
      locationAccuracy: 18.0,
      locationProtocol: 'GPS',
      batteryLevel: 62,
      status: 'DISPATCHED',
      communicationMethod: 'BLE_MESH',
      deliveryStatus: 'DELIVERED_SERVER',
      acknowledgementReceived: true,
      hopCount: 1,
      responseTeamId: 'team_med_bravo',
      operatorNotes: 'Inflatable boat dispatched. ETA 8 minutes.',
    },
    {
      id: 'SOS_14D98E',
      userId: citizenUser.id,
      emergencyCategory: 'DISASTER_EMERGENCY',
      disasterSubtype: 'BUILDING_COLLAPSE',
      priority: 'CRITICAL',
      description: 'Basement support pillar cracked in commercial complex. Cracking noises heard on floors 1-3.',
      latitude: 28.6139,
      longitude: 77.2090,
      locationAccuracy: 8.0,
      locationProtocol: 'GPS',
      batteryLevel: 88,
      status: 'ACKNOWLEDGED',
      communicationMethod: 'INTERNET',
      deliveryStatus: 'DELIVERED_SERVER',
      acknowledgementReceived: true,
      hopCount: 0,
      responseTeamId: 'team_fire_hazard',
      operatorNotes: 'Structural evacuation order issued. Perimeter secured.',
    },
  ];

  for (const inc of initialIncidents) {
    const existing = await prisma.incident.findUnique({ where: { id: inc.id } });
    if (!existing) {
      await prisma.incident.create({
        data: {
          ...inc,
          history: {
            create: {
              previousStatus: 'PENDING',
              newStatus: inc.status,
              changedBy: 'System Auto-Triage',
              notes: 'Initial incident intake and telemetry packet verification.',
            },
          },
        },
      });
    }
  }
  console.log('✓ Initial Incidents seeded.');
  console.log('🌟 AAPDA MATRIX database seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

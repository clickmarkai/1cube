import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Create team and brand config
  const brandConfig = await prisma.brandConfig.create({
    data: {
      companyName: "Wellness Brand Co",
      brandVoice: "friendly",
      defaultLanguage: "id",
      timezone: "Asia/Jakarta",
      currency: "IDR",
      autoTranslate: true,
      complianceMode: "strict",
    },
  });

  const team = await prisma.team.create({
    data: {
      name: "Main Team",
      companyName: "Wellness Brand Co",
      brandConfigId: brandConfig.id,
    },
  });

  // Create users
  const demoUser = await prisma.user.create({
    data: {
      email: "demo@1cube.id",
      name: "Demo User",
      password: "$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36Z4JNYqpRfEZPRqxnNJhEO", // demo123
      role: "owner",
      teamId: team.id,
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: "sarah@company.id",
      name: "Sarah Marketing",
      role: "admin",
      teamId: team.id,
    },
  });

  // Create channels
  const shopeeChannel = await prisma.channel.create({
    data: {
      type: "shopee",
      name: "Shopee Store",
      teamId: team.id,
      connected: true,
      lastSync: new Date(Date.now() - 3600000),
    },
  });

  const tokopediaChannel = await prisma.channel.create({
    data: {
      type: "tokopedia",
      name: "Tokopedia Store",
      teamId: team.id,
      connected: true,
      lastSync: new Date(Date.now() - 7200000),
    },
  });

  const tiktokChannel = await prisma.channel.create({
    data: {
      type: "tiktok",
      name: "TikTok Shop",
      teamId: team.id,
      connected: false,
    },
  });

  // Create products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: "Vitamin C Serum",
        sku: "VCS-001",
        description: "Brightening serum with 20% Vitamin C",
        category: "skincare",
        price: 350000,
        cost: 150000,
        images: JSON.stringify(["/images/vitamin-c-serum.jpg"]),
      },
    }),
    prisma.product.create({
      data: {
        name: "Collagen Supplement",
        sku: "COL-001",
        description: "Marine collagen for skin health",
        category: "supplements",
        price: 450000,
        cost: 200000,
        images: JSON.stringify(["/images/collagen.jpg"]),
      },
    }),
    prisma.product.create({
      data: {
        name: "Omega-3 Capsules",
        sku: "OMG-001",
        description: "High-quality fish oil capsules",
        category: "supplements",
        price: 380000,
        cost: 180000,
        images: JSON.stringify(["/images/omega3.jpg"]),
      },
    }),
    prisma.product.create({
      data: {
        name: "Protein Powder",
        sku: "PRO-001",
        description: "Whey protein isolate, vanilla flavor",
        category: "fitness",
        price: 580000,
        cost: 250000,
        images: JSON.stringify(["/images/protein.jpg"]),
      },
    }),
    prisma.product.create({
      data: {
        name: "Probiotic Drink",
        sku: "PRB-001",
        description: "Daily probiotic for gut health",
        category: "healthy-food",
        price: 120000,
        cost: 50000,
        images: JSON.stringify(["/images/probiotic.jpg"]),
      },
    }),
  ]);

  // Create inventory for each product
  for (const product of products) {
    await Promise.all([
      prisma.inventory.create({
        data: {
          productId: product.id,
          channelType: "shopee",
          quantity: Math.floor(Math.random() * 100) + 50,
          reorderPoint: 30,
          lastRestocked: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        },
      }),
      prisma.inventory.create({
        data: {
          productId: product.id,
          channelType: "tokopedia",
          quantity: Math.floor(Math.random() * 100) + 50,
          reorderPoint: 30,
          lastRestocked: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        },
      }),
      prisma.inventory.create({
        data: {
          productId: product.id,
          channelType: "warehouse",
          quantity: Math.floor(Math.random() * 50) + 25,
          reorderPoint: 20,
          lastRestocked: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);
  }

  // Create listings
  for (const product of products.slice(0, 3)) {
    await prisma.listing.create({
      data: {
        productId: product.id,
        channelId: shopeeChannel.id,
        status: "active",
        price: product.price,
        views: Math.floor(Math.random() * 10000) + 1000,
        syncStatus: "synced",
        url: `https://shopee.co.id/product/${product.sku}`,
      },
    });

    await prisma.listing.create({
      data: {
        productId: product.id,
        channelId: tokopediaChannel.id,
        status: "active",
        price: product.price + 5000,
        views: Math.floor(Math.random() * 8000) + 800,
        syncStatus: "synced",
        url: `https://tokopedia.com/1cube/${product.sku}`,
      },
    });
  }

  // Create campaigns
  const campaign1 = await prisma.campaign.create({
    data: {
      name: "Wellness Bundle Q1 2025",
      userId: demoUser.id,
      status: "active",
      channels: JSON.stringify(["shopee", "tokopedia", "meta"]),
      budget: 50000000,
      spent: 32500000,
      objective: "conversions",
      autoOptimize: true,
    },
  });

  const campaign2 = await prisma.campaign.create({
    data: {
      name: "Morning Routine Campaign",
      userId: demoUser.id,
      status: "active",
      channels: JSON.stringify(["tiktok", "instagram"]),
      budget: 30000000,
      spent: 18750000,
      objective: "conversions",
      autoOptimize: true,
    },
  });

  // Create experiments
  await prisma.experiment.create({
    data: {
      campaignId: campaign1.id,
      name: "Copy Test A/B",
      variant: "A",
      metrics: JSON.stringify({
        impressions: 125000,
        clicks: 6250,
        conversions: 290,
        ctr: 5.0,
        cvr: 4.6,
      }),
      status: "running",
    },
  });

  // Create orders
  const order1 = await prisma.order.create({
    data: {
      orderId: "ORD-2025-001",
      channelId: shopeeChannel.id,
      customerName: "Siti Nurhaliza",
      customerEmail: "siti@email.com",
      customerPhone: "+62 812-3456-7890",
      customerAddress: "Jl. Sudirman No. 123, Jakarta Selatan 12190",
      subtotal: 820000,
      shipping: 0,
      total: 820000,
      status: "processing",
      paymentMethod: "ShopeePay",
    },
  });

  await prisma.orderItem.createMany({
    data: [
      {
        orderId: order1.id,
        productId: products[0].id,
        quantity: 2,
        price: 350000,
      },
      {
        orderId: order1.id,
        productId: products[4].id,
        quantity: 1,
        price: 120000,
      },
    ],
  });

  // Create bundles
  const bundle1 = await prisma.bundle.create({
    data: {
      name: "Morning Glow Bundle",
      description: "Perfect morning routine for glowing skin",
      originalPrice: 3950000,
      bundlePrice: 3160000,
      discount: 20,
      margin: 58,
      status: "active",
      rationale: "Perfect morning routine combination - Vitamin C for skin glow + Probiotics for gut health.",
      habitPairing: "Take probiotic drink first thing in the morning, apply Vitamin C serum after cleanse",
      channels: JSON.stringify(["shopee", "tokopedia", "tiktok"]),
    },
  });

  await prisma.bundleItem.createMany({
    data: [
      {
        bundleId: bundle1.id,
        productId: products[0].id,
        quantity: 1,
      },
      {
        bundleId: bundle1.id,
        productId: products[4].id,
        quantity: 30,
      },
    ],
  });

  // Create email flows
  await prisma.emailFlow.create({
    data: {
      name: "Welcome Series",
      type: "welcome",
      status: "active",
      emails: 3,
      avgOpenRate: 45.2,
      avgClickRate: 12.8,
      revenue: 3450000,
      subscribers: 1250,
      flow: JSON.stringify([
        { delay: 0, subject: "Welcome to 1Cube!", template: "welcome-1" },
        { delay: 3, subject: "Discover Our Best Sellers", template: "welcome-2" },
        { delay: 7, subject: "Your First Purchase Discount", template: "welcome-3" },
      ]),
    },
  });

  // Create segments
  await prisma.segment.create({
    data: {
      name: "High-Value Customers",
      criteria: JSON.stringify([
        { field: "totalSpent", operator: ">", value: 1000000 },
        { field: "orderCount", operator: ">", value: 3 },
        { field: "lastOrderDays", operator: "<", value: 90 },
      ]),
      size: 850,
      growthRate: 12.5,
    },
  });

  // Create FAQs
  await prisma.faq.createMany({
    data: [
      {
        question: "How long is shipping?",
        answer: "2-3 days for Jabodetabek, 3-5 days for other areas",
        category: "shipping",
        usage: 245,
      },
      {
        question: "What's your return policy?",
        answer: "30 days for unopened products",
        category: "returns",
        usage: 128,
      },
      {
        question: "Do you offer free shipping?",
        answer: "Yes, for orders above Rp 200,000",
        category: "shipping",
        usage: 312,
      },
    ],
  });

  // Create insights
  await prisma.insight.create({
    data: {
      type: "trend",
      title: "Morning Routine Content Surging",
      description: "Morning wellness routine content seeing 3x engagement on TikTok Shop",
      data: JSON.stringify({
        engagement: 300,
        platform: "tiktok",
        category: "content",
      }),
      source: "TikTok Analytics",
      impact: "high",
      actionable: "Create morning routine bundle with video content",
      userId: demoUser.id,
    },
  });

  // Create metric snapshots
  const dates = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date;
  });

  for (const date of dates) {
    await prisma.metricSnapshot.create({
      data: {
        date,
        metric: "revenue",
        value: Math.floor(Math.random() * 10000000) + 5000000,
      },
    });

    await prisma.metricSnapshot.create({
      data: {
        date,
        metric: "orders",
        value: Math.floor(Math.random() * 100) + 50,
      },
    });
  }

  console.log("✅ Seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
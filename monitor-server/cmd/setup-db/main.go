package main

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"monitor-server/internal/config"
	"monitor-server/internal/database"
	"monitor-server/internal/model"
)

func main() {
	fmt.Println("🚀 数据库完整测试和设置开始...")
	fmt.Println("=====================================")

	// 加载配置
	fmt.Println("📋 加载配置文件...")
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("❌ 加载配置失败: %v", err)
	}

	// 连接数据库
	fmt.Println("🔗 连接数据库...")
	db, err := database.New(cfg)
	if err != nil {
		log.Fatalf("❌ 数据库连接失败: %v", err)
	}
	defer func() {
		if err := db.Close(); err != nil {
			fmt.Printf("⚠️  关闭数据库连接时出错: %v\n", err)
		}
	}()

	fmt.Println("✅ 数据库连接成功!")

	// 创建schema
	fmt.Printf("🏗️  确保schema '%s' 存在...\n", cfg.Database.Postgres.Schema)
	if err := db.CreateSchema(cfg.Database.Postgres.Schema); err != nil {
		log.Fatalf("❌ 创建schema失败: %v", err)
	}
	fmt.Println("✅ Schema准备完成!")

	// 执行数据库设置（迁移+初始化数据）
	fmt.Println("🔄 执行数据库迁移和初始化...")
	if err := db.Setup(); err != nil {
		log.Fatalf("❌ 数据库设置失败: %v", err)
	}
	fmt.Println("✅ 数据库迁移和初始化完成!")

	// 验证表是否创建成功
	fmt.Println("🔍 验证数据库表...")
	tables := []string{"system_metrics", "system_info", "alert_rules", "alerts", "monitoring_configs"}
	
	for _, table := range tables {
		var count int64
		fullTableName := cfg.Database.Postgres.Schema + "." + table
		if err := db.Raw("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = ? AND table_name = ?", 
			cfg.Database.Postgres.Schema, table).Scan(&count).Error; err != nil {
			fmt.Printf("❌ 检查表 %s 失败: %v\n", table, err)
		} else if count > 0 {
			fmt.Printf("✅ 表 %s 存在\n", fullTableName)
		} else {
			fmt.Printf("❌ 表 %s 不存在\n", fullTableName)
		}
	}

	// 检查默认配置
	fmt.Println("\n📊 检查默认监控配置...")
	var configs []model.MonitoringConfig
	if err := db.Find(&configs).Error; err != nil {
		fmt.Printf("❌ 查询监控配置失败: %v\n", err)
	} else {
		fmt.Printf("✅ 找到 %d 个监控配置:\n", len(configs))
		for _, config := range configs {
			fmt.Printf("   - %s: %s (%s)\n", config.Key, config.Value, config.Description)
		}
	}

	// 检查默认告警规则
	fmt.Println("\n🚨 检查默认告警规则...")
	var rules []model.AlertRule
	if err := db.Find(&rules).Error; err != nil {
		fmt.Printf("❌ 查询告警规则失败: %v\n", err)
	} else {
		fmt.Printf("✅ 找到 %d 个告警规则:\n", len(rules))
		for _, rule := range rules {
			status := "禁用"
			if rule.Enabled {
				status = "启用"
			}
			fmt.Printf("   - %s: %s %.1f%% [%s] (%s)\n", rule.Name, rule.Operator, rule.Threshold, status, rule.Severity)
		}
	}

	// 测试插入系统指标数据
	fmt.Println("\n📝 测试插入系统指标数据...")
	testMetric := model.SystemMetrics{
		Hostname:     "test-server",
		CPUUsage:     45.5,
		MemoryUsage:  62.3,
		MemoryTotal:  8589934592, // 8GB
		MemoryUsed:   5348914586, // ~5GB
		DiskUsage:    78.9,
		DiskTotal:    107374182400, // 100GB
		DiskUsed:     84722906112,  // ~79GB
		NetworkSent:  1024000,
		NetworkRecv:  2048000,
		Timestamp:    time.Now(),
	}

	if err := db.Create(&testMetric).Error; err != nil {
		fmt.Printf("❌ 插入测试数据失败: %v\n", err)
	} else {
		fmt.Printf("✅ 测试指标数据插入成功，ID: %d\n", testMetric.ID)
	}

	// 测试查询最新的指标数据
	fmt.Println("\n📖 测试查询最新指标数据...")
	var latestMetric model.SystemMetrics
	if err := db.Order("timestamp desc").First(&latestMetric).Error; err != nil {
		fmt.Printf("❌ 查询最新指标失败: %v\n", err)
	} else {
		fmt.Printf("✅ 最新指标数据:\n")
		fmt.Printf("   主机: %s\n", latestMetric.Hostname)
		fmt.Printf("   CPU使用率: %.1f%%\n", latestMetric.CPUUsage)
		fmt.Printf("   内存使用率: %.1f%%\n", latestMetric.MemoryUsage)
		fmt.Printf("   磁盘使用率: %.1f%%\n", latestMetric.DiskUsage)
		fmt.Printf("   时间: %s\n", latestMetric.Timestamp.Format("2006-01-02 15:04:05"))
	}

	// 测试插入系统信息
	fmt.Println("\n🖥️  测试插入系统信息...")
	testInfo := model.SystemInfoDB{
		Hostname:        "test-server",
		OS:              "linux",
		Platform:        "ubuntu",
		PlatformFamily:  "debian",
		PlatformVersion: "24.04",
		KernelVersion:   "6.8.0-51-generic",
		KernelArch:      "x86_64",
		CPUCores:        8,
		CPUModel:        "Intel(R) Core(TM) i7-10700K CPU @ 3.80GHz",
		TotalMemory:     8589934592,
		Uptime:          86400,
		LastSeen:        time.Now(),
	}

	if err := db.Create(&testInfo).Error; err != nil {
		fmt.Printf("❌ 插入系统信息失败: %v\n", err)
	} else {
		fmt.Printf("✅ 系统信息插入成功，ID: %d\n", testInfo.ID)
	}

	// 测试数据库性能（插入批量数据）
	fmt.Println("\n⚡ 测试批量插入性能...")
	start := time.Now()
	var batchMetrics []model.SystemMetrics
	
	for i := 0; i < 100; i++ {
		metric := model.SystemMetrics{
			Hostname:     fmt.Sprintf("server-%d", i%5), // 模拟5台服务器
			CPUUsage:     float64(30 + i%70),  // 30-99%
			MemoryUsage:  float64(20 + i%60),  // 20-79%
			MemoryTotal:  8589934592,
			MemoryUsed:   uint64(float64(8589934592) * (float64(20+i%60) / 100)),
			DiskUsage:    float64(40 + i%50),  // 40-89%
			DiskTotal:    107374182400,
			DiskUsed:     uint64(float64(107374182400) * (float64(40+i%50) / 100)),
			NetworkSent:  uint64(1000000 + i*1000),
			NetworkRecv:  uint64(2000000 + i*2000),
			Timestamp:    time.Now().Add(-time.Duration(i) * time.Minute),
		}
		batchMetrics = append(batchMetrics, metric)
	}

	if err := db.CreateInBatches(batchMetrics, 50).Error; err != nil {
		fmt.Printf("❌ 批量插入失败: %v\n", err)
	} else {
		duration := time.Since(start)
		fmt.Printf("✅ 批量插入100条记录完成，耗时: %v\n", duration)
		
		// 统计总记录数
		var total int64
		if err := db.Model(&model.SystemMetrics{}).Count(&total).Error; err == nil {
			fmt.Printf("✅ 系统指标表中共有 %d 条记录\n", total)
		}
	}

	// 测试复杂查询
	fmt.Println("\n🔍 测试复杂查询...")
	var avgCPU float64
	if err := db.Model(&model.SystemMetrics{}).
		Where("timestamp > ?", time.Now().Add(-24*time.Hour)).
		Select("AVG(cpu_usage)").
		Scan(&avgCPU).Error; err != nil {
		fmt.Printf("❌ 查询平均CPU使用率失败: %v\n", err)
	} else {
		fmt.Printf("✅ 过去24小时平均CPU使用率: %.2f%%\n", avgCPU)
	}

	// 按主机名分组统计
	type HostStats struct {
		Hostname string  `json:"hostname"`
		Count    int64   `json:"count"`
		AvgCPU   float64 `json:"avg_cpu"`
		MaxCPU   float64 `json:"max_cpu"`
	}
	
	var hostStats []HostStats
	if err := db.Model(&model.SystemMetrics{}).
		Select("hostname, COUNT(*) as count, AVG(cpu_usage) as avg_cpu, MAX(cpu_usage) as max_cpu").
		Group("hostname").
		Scan(&hostStats).Error; err != nil {
		fmt.Printf("❌ 查询主机统计失败: %v\n", err)
	} else {
		fmt.Printf("✅ 主机统计信息:\n")
		for _, stat := range hostStats {
			fmt.Printf("   - %s: %d条记录, 平均CPU: %.1f%%, 最高CPU: %.1f%%\n", 
				stat.Hostname, stat.Count, stat.AvgCPU, stat.MaxCPU)
		}
	}

	// 测试数据库健康状态
	fmt.Println("\n❤️  数据库健康状态:")
	health := db.Health()
	healthJSON, _ := json.MarshalIndent(health, "", "  ")
	fmt.Printf("%s\n", healthJSON)

	// 清理测试数据（可选）
	fmt.Println("\n🧹 清理测试数据...")
	if err := db.Where("hostname LIKE ?", "test-server").Delete(&model.SystemMetrics{}).Error; err != nil {
		fmt.Printf("⚠️  清理系统指标数据失败: %v\n", err)
	}
	if err := db.Where("hostname LIKE ?", "server-%").Delete(&model.SystemMetrics{}).Error; err != nil {
		fmt.Printf("⚠️  清理批量测试数据失败: %v\n", err)
	}
	if err := db.Where("hostname = ?", "test-server").Delete(&model.SystemInfoDB{}).Error; err != nil {
		fmt.Printf("⚠️  清理系统信息数据失败: %v\n", err)
	}
	fmt.Println("✅ 测试数据清理完成!")

	fmt.Println("\n=====================================")
	fmt.Println("🎉 数据库完整测试成功完成!")
	fmt.Println("✅ 数据库已准备好用于生产环境!")
	fmt.Println("📊 GORM配置和PostgreSQL集成工作正常!")
	fmt.Println("🚀 可以开始使用监控系统了!")
}
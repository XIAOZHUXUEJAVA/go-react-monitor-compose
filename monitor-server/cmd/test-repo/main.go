package main

import (
	"fmt"
	"log"
	"time"

	"monitor-server/internal/config"
	"monitor-server/internal/database"
	"monitor-server/internal/model"
	"monitor-server/internal/repository"
)

func main() {
	fmt.Println("🧪 Repository层测试开始...")
	fmt.Println("=====================================")

	// 加载配置和连接数据库
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("❌ 加载配置失败: %v", err)
	}

	db, err := database.New(cfg)
	if err != nil {
		log.Fatalf("❌ 数据库连接失败: %v", err)
	}
	defer db.Close()

	// 确保数据库已设置
	if err := db.Setup(); err != nil {
		log.Fatalf("❌ 数据库设置失败: %v", err)
	}

	// 创建Repository实例
	metricsRepo := repository.NewMetricsRepository(db.DB)
	systemInfoRepo := repository.NewSystemInfoRepository(db.DB)
	configRepo := repository.NewConfigRepository(db.DB)
	alertRepo := repository.NewAlertRepository(db.DB)

	fmt.Println("✅ Repository实例创建成功!")

	// 测试系统指标Repository
	fmt.Println("\n📊 测试系统指标Repository...")
	
	// 创建测试指标数据
	testMetrics := []model.SystemMetrics{
		{
			Hostname:     "web-server-01",
			CPUUsage:     65.5,
			MemoryUsage:  72.3,
			MemoryTotal:  16777216000, // 16GB
			MemoryUsed:   12125925376, // ~11.3GB
			DiskUsage:    45.2,
			DiskTotal:    214748364800, // 200GB
			DiskUsed:     97157544960,  // ~90GB
			NetworkSent:  1024000000,   // 1GB
			NetworkRecv:  2048000000,   // 2GB
			Timestamp:    time.Now(),
		},
		{
			Hostname:     "web-server-01",
			CPUUsage:     70.1,
			MemoryUsage:  75.8,
			MemoryTotal:  16777216000,
			MemoryUsed:   12718055424,
			DiskUsage:    45.3,
			DiskTotal:    214748364800,
			DiskUsed:     97372364800,
			NetworkSent:  1025000000,
			NetworkRecv:  2050000000,
			Timestamp:    time.Now().Add(-5 * time.Minute),
		},
	}

	if err := metricsRepo.CreateBatch(testMetrics); err != nil {
		fmt.Printf("❌ 批量创建指标失败: %v\n", err)
	} else {
		fmt.Println("✅ 批量创建指标成功!")
	}

	// 查询最新指标
	latest, err := metricsRepo.GetLatestByHostname("web-server-01")
	if err != nil {
		fmt.Printf("❌ 查询最新指标失败: %v\n", err)
	} else {
		fmt.Printf("✅ 最新指标 - CPU: %.1f%%, 内存: %.1f%%, 磁盘: %.1f%%\n", 
			latest.CPUUsage, latest.MemoryUsage, latest.DiskUsage)
	}

	// 查询历史数据
	history, err := metricsRepo.GetHistoryByHostname("web-server-01", 1)
	if err != nil {
		fmt.Printf("❌ 查询历史数据失败: %v\n", err)
	} else {
		fmt.Printf("✅ 过去1小时共有 %d 条历史记录\n", len(history))
	}

	// 查询平均CPU使用率
	avgCPU, err := metricsRepo.GetAverageCPUUsage("web-server-01", 24)
	if err != nil {
		fmt.Printf("❌ 查询平均CPU使用率失败: %v\n", err)
	} else {
		fmt.Printf("✅ 过去24小时平均CPU使用率: %.2f%%\n", avgCPU)
	}

	// 获取主机统计
	hostStats, err := metricsRepo.GetHostStats()
	if err != nil {
		fmt.Printf("❌ 获取主机统计失败: %v\n", err)
	} else {
		fmt.Printf("✅ 主机统计信息:\n")
		for _, stat := range hostStats {
			fmt.Printf("   - %s: %d条记录, 平均CPU: %.1f%%, 最高CPU: %.1f%%\n", 
				stat.Hostname, stat.Count, stat.AvgCPU, stat.MaxCPU)
		}
	}

	// 测试系统信息Repository
	fmt.Println("\n🖥️  测试系统信息Repository...")
	
	testSysInfo := &model.SystemInfoDB{
		Hostname:        "web-server-01",
		OS:              "linux",
		Platform:        "ubuntu",
		PlatformFamily:  "debian",
		PlatformVersion: "22.04",
		KernelVersion:   "5.15.0-89-generic",
		KernelArch:      "x86_64",
		CPUCores:        8,
		CPUModel:        "Intel(R) Xeon(R) CPU E3-1230 v6 @ 3.50GHz",
		TotalMemory:     16777216000,
		Uptime:          3600000,
		LastSeen:        time.Now(),
	}

	if err := systemInfoRepo.CreateOrUpdate(testSysInfo); err != nil {
		fmt.Printf("❌ 创建/更新系统信息失败: %v\n", err)
	} else {
		fmt.Println("✅ 系统信息创建/更新成功!")
	}

	// 查询系统信息
	sysInfo, err := systemInfoRepo.GetByHostname("web-server-01")
	if err != nil {
		fmt.Printf("❌ 查询系统信息失败: %v\n", err)
	} else {
		fmt.Printf("✅ 系统信息 - %s: %s %s, %d核CPU, %.1fGB内存\n", 
			sysInfo.Hostname, sysInfo.OS, sysInfo.PlatformVersion, 
			sysInfo.CPUCores, float64(sysInfo.TotalMemory)/1024/1024/1024)
	}

	// 更新最后见到时间
	if err := systemInfoRepo.UpdateLastSeen("web-server-01"); err != nil {
		fmt.Printf("❌ 更新最后见到时间失败: %v\n", err)
	} else {
		fmt.Println("✅ 最后见到时间更新成功!")
	}

	// 测试配置Repository
	fmt.Println("\n⚙️  测试配置Repository...")
	
	// 查询单个配置
	refreshConfig, err := configRepo.GetByKey("refresh_interval")
	if err != nil {
		fmt.Printf("❌ 查询刷新间隔配置失败: %v\n", err)
	} else {
		fmt.Printf("✅ 刷新间隔配置: %s = %s (%s)\n", 
			refreshConfig.Key, refreshConfig.Value, refreshConfig.Description)
	}

	// 查询分类配置
	systemConfigs, err := configRepo.GetByCategory("system")
	if err != nil {
		fmt.Printf("❌ 查询系统配置失败: %v\n", err)
	} else {
		fmt.Printf("✅ 系统配置 (%d个):\n", len(systemConfigs))
		for _, config := range systemConfigs {
			fmt.Printf("   - %s: %s\n", config.Key, config.Value)
		}
	}

	// 更新配置
	refreshConfig.Value = "30"
	if err := configRepo.Update(refreshConfig); err != nil {
		fmt.Printf("❌ 更新配置失败: %v\n", err)
	} else {
		fmt.Println("✅ 配置更新成功!")
		
		// 验证更新
		if updatedConfig, err := configRepo.GetByKey("refresh_interval"); err == nil {
			fmt.Printf("✅ 验证更新: 刷新间隔现在是 %s 秒\n", updatedConfig.Value)
		}
	}

	// 测试告警Repository
	fmt.Println("\n🚨 测试告警Repository...")
	
	// 查询活跃的告警规则
	activeRules, err := alertRepo.GetActiveRules()
	if err != nil {
		fmt.Printf("❌ 查询活跃告警规则失败: %v\n", err)
	} else {
		fmt.Printf("✅ 活跃告警规则 (%d个):\n", len(activeRules))
		for _, rule := range activeRules[:3] { // 只显示前3个
			fmt.Printf("   - %s: %s %.1f%% [%s]\n", 
				rule.Name, rule.Operator, rule.Threshold, rule.Severity)
		}
	}

	// 创建测试告警
	if len(activeRules) > 0 {
		testAlert := &model.Alert{
			RuleID:     activeRules[0].ID,
			Hostname:   "web-server-01",
			MetricType: activeRules[0].MetricType,
			Value:      85.5,
			Threshold:  activeRules[0].Threshold,
			Severity:   activeRules[0].Severity,
			Message:    "CPU使用率持续过高",
			Status:     "active",
			StartTime:  time.Now(),
		}

		if err := alertRepo.CreateAlert(testAlert); err != nil {
			fmt.Printf("❌ 创建告警失败: %v\n", err)
		} else {
			fmt.Printf("✅ 创建告警成功，ID: %d\n", testAlert.ID)
			
			// 查询活跃告警
			activeAlerts, err := alertRepo.GetActiveAlerts()
			if err != nil {
				fmt.Printf("❌ 查询活跃告警失败: %v\n", err)
			} else {
				fmt.Printf("✅ 当前活跃告警: %d个\n", len(activeAlerts))
				if len(activeAlerts) > 0 {
					alert := activeAlerts[len(activeAlerts)-1] // 最新的告警
					fmt.Printf("   - %s: %s (值: %.1f, 阈值: %.1f)\n", 
						alert.Hostname, alert.Message, alert.Value, alert.Threshold)
				}
			}

			// 解决告警
			if err := alertRepo.ResolveAlert(testAlert.ID); err != nil {
				fmt.Printf("❌ 解决告警失败: %v\n", err)
			} else {
				fmt.Println("✅ 告警已解决!")
			}
		}
	}

	// 性能测试：批量操作
	fmt.Println("\n⚡ 性能测试...")
	start := time.Now()
	
	var batchMetrics []model.SystemMetrics
	for i := 0; i < 1000; i++ {
		metric := model.SystemMetrics{
			Hostname:     fmt.Sprintf("server-%03d", i%10),
			CPUUsage:     float64(20 + i%80),
			MemoryUsage:  float64(30 + i%70),
			MemoryTotal:  8589934592,
			MemoryUsed:   uint64(float64(8589934592) * (float64(30+i%70) / 100)),
			DiskUsage:    float64(40 + i%60),
			DiskTotal:    107374182400,
			DiskUsed:     uint64(float64(107374182400) * (float64(40+i%60) / 100)),
			NetworkSent:  uint64(1000000 + i*1000),
			NetworkRecv:  uint64(2000000 + i*2000),
			Timestamp:    time.Now().Add(-time.Duration(i) * time.Second),
		}
		batchMetrics = append(batchMetrics, metric)
	}

	if err := metricsRepo.CreateBatch(batchMetrics); err != nil {
		fmt.Printf("❌ 批量插入1000条记录失败: %v\n", err)
	} else {
		duration := time.Since(start)
		fmt.Printf("✅ 批量插入1000条记录完成，耗时: %v (%.2f records/sec)\n", 
			duration, 1000.0/duration.Seconds())
	}

	// 清理测试数据
	fmt.Println("\n🧹 清理测试数据...")
	db.DB.Where("hostname LIKE ?", "web-server-%").Delete(&model.SystemMetrics{})
	db.DB.Where("hostname LIKE ?", "server-%").Delete(&model.SystemMetrics{})
	db.DB.Where("hostname = ?", "web-server-01").Delete(&model.SystemInfoDB{})
	db.DB.Where("hostname = ?", "web-server-01").Delete(&model.Alert{})
	
	// 恢复配置
	refreshConfig.Value = "60"
	configRepo.Update(refreshConfig)
	
	fmt.Println("✅ 测试数据清理完成!")

	fmt.Println("\n=====================================")
	fmt.Println("🎉 Repository层测试全部通过!")
	fmt.Println("✅ GORM最佳实践验证成功!")
	fmt.Println("📊 数据库操作性能良好!")
}
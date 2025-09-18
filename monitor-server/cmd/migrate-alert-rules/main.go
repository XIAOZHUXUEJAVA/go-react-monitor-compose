package main

import (
	"fmt"
	"log"

	"monitor-server/internal/config"
	"monitor-server/internal/database"
	"monitor-server/internal/model"
)

func main() {
	fmt.Println("🔄 正在迁移数据库以支持主机级别的告警规则...")

	// 加载配置
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// 连接数据库
	db, err := database.New(&cfg.Database)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// 执行迁移
	if err := db.AutoMigrate(); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	fmt.Println("✅ 数据库迁移完成!")

	// 检查现有的告警规则
	var rules []model.AlertRule
	if err := db.Find(&rules).Error; err != nil {
		log.Fatalf("Failed to query alert rules: %v", err)
	}

	fmt.Printf("📊 当前数据库中有 %d 条告警规则:\n", len(rules))
	for _, rule := range rules {
		hostInfo := "全局规则"
		if rule.HostID != nil {
			hostInfo = fmt.Sprintf("主机ID: %d", *rule.HostID)
		}
		fmt.Printf("   - %s [%s] (%s)\n", rule.Name, hostInfo, rule.Severity)
	}

	fmt.Println("\n🎯 迁移说明:")
	fmt.Println("1. AlertRule表已添加host_id字段")
	fmt.Println("2. host_id为NULL表示全局规则")
	fmt.Println("3. host_id有值表示主机特定规则")
	fmt.Println("4. 可以通过API为特定主机创建自定义告警规则")
	fmt.Println("\n🚀 现在您可以:")
	fmt.Println("• 在设置页面选择特定主机配置告警")
	fmt.Println("• 为不同主机设置不同的告警阈值")
	fmt.Println("• 全局规则仍然适用于所有主机")
}
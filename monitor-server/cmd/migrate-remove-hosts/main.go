package main

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"monitor-server/internal/config"
)

func main() {
	// 加载配置
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// 连接数据库
	db, err := gorm.Open(sqlite.Open(cfg.Database.DSN), &gorm.Config{
		Logger: logger.Default.LogLevel(logger.Info),
	})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	fmt.Println("开始清理主机管理相关的数据表...")

	// 删除主机相关的数据表
	tables := []string{
		"host_group_members",
		"host_groups", 
		"host_configs",
		"hosts",
	}

	for _, table := range tables {
		if err := db.Migrator().DropTable(table); err != nil {
			fmt.Printf("警告: 删除表 %s 失败: %v\n", table, err)
		} else {
			fmt.Printf("✓ 成功删除表: %s\n", table)
		}
	}

	// 清理告警规则表中的主机关联字段
	fmt.Println("\n更新告警规则表结构...")
	
	// 检查 alert_rules 表是否存在 host_id 列
	if db.Migrator().HasColumn("alert_rules", "host_id") {
		// 先删除外键约束（如果存在）
		if err := db.Exec("PRAGMA foreign_keys=off").Error; err != nil {
			fmt.Printf("警告: 无法关闭外键约束: %v\n", err)
		}

		// 创建新的表结构（不包含 host_id）
		createTableSQL := `
		CREATE TABLE alert_rules_new (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			metric_type TEXT NOT NULL,
			operator TEXT NOT NULL,
			threshold REAL NOT NULL,
			severity TEXT NOT NULL,
			enabled BOOLEAN NOT NULL DEFAULT true,
			description TEXT,
			created_at DATETIME,
			updated_at DATETIME
		)`

		if err := db.Exec(createTableSQL).Error; err != nil {
			fmt.Printf("错误: 创建新表失败: %v\n", err)
		} else {
			// 复制数据（排除 host_id 列）
			copyDataSQL := `
			INSERT INTO alert_rules_new (id, name, metric_type, operator, threshold, severity, enabled, description, created_at, updated_at)
			SELECT id, name, metric_type, operator, threshold, severity, enabled, description, created_at, updated_at
			FROM alert_rules`

			if err := db.Exec(copyDataSQL).Error; err != nil {
				fmt.Printf("错误: 复制数据失败: %v\n", err)
			} else {
				// 删除旧表
				if err := db.Exec("DROP TABLE alert_rules").Error; err != nil {
					fmt.Printf("错误: 删除旧表失败: %v\n", err)
				} else {
					// 重命名新表
					if err := db.Exec("ALTER TABLE alert_rules_new RENAME TO alert_rules").Error; err != nil {
						fmt.Printf("错误: 重命名表失败: %v\n", err)
					} else {
						fmt.Println("✓ 成功更新告警规则表结构")
					}
				}
			}
		}

		// 重新启用外键约束
		if err := db.Exec("PRAGMA foreign_keys=on").Error; err != nil {
			fmt.Printf("警告: 无法启用外键约束: %v\n", err)
		}
	} else {
		fmt.Println("✓ 告警规则表已经是正确的结构")
	}

	fmt.Println("\n数据库重构完成！")
	fmt.Println("系统现在已配置为本机监控模式。")
	
	os.Exit(0)
}
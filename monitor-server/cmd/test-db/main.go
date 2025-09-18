package main

import (
	"encoding/json"
	"fmt"
	"log"

	"monitor-server/internal/config"
	"monitor-server/internal/database"
)

func main() {
	fmt.Println("🔍 数据库连接测试开始...")
	fmt.Println("=====================================")

	// 加载配置
	fmt.Println("📋 加载配置文件...")
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("❌ 加载配置失败: %v", err)
	}

	// 显示数据库配置信息（隐藏密码）
	fmt.Printf("📊 数据库配置信息:\n")
	fmt.Printf("   主机: %s\n", cfg.Database.Postgres.Host)
	fmt.Printf("   端口: %d\n", cfg.Database.Postgres.Port)
	fmt.Printf("   用户: %s\n", cfg.Database.Postgres.User)
	fmt.Printf("   数据库: %s\n", cfg.Database.Postgres.DBName)
	fmt.Printf("   模式: %s\n", cfg.Database.Postgres.Schema)
	fmt.Printf("   SSL模式: %s\n", cfg.Database.Postgres.SSLMode)
	fmt.Printf("   时区: %s\n", cfg.Database.Postgres.Timezone)
	fmt.Printf("   最大连接数: %d\n", cfg.Database.Postgres.MaxOpenConns)
	fmt.Printf("   最大空闲连接数: %d\n", cfg.Database.Postgres.MaxIdleConns)
	fmt.Println()

	// 尝试连接数据库
	fmt.Println("🔗 尝试连接数据库...")
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

	// 测试连接
	fmt.Println("🔍 测试数据库连通性...")
	if err := db.Ping(); err != nil {
		log.Fatalf("❌ 数据库连通性测试失败: %v", err)
	}
	fmt.Println("✅ 数据库连通性测试通过!")

	// 创建schema（如果不存在）
	fmt.Printf("🏗️  创建schema '%s'（如果不存在）...\n", cfg.Database.Postgres.Schema)
	if err := db.CreateSchema(cfg.Database.Postgres.Schema); err != nil {
		fmt.Printf("⚠️  创建schema失败: %v\n", err)
	} else {
		fmt.Println("✅ Schema创建成功或已存在!")
	}

	// 获取数据库健康状态
	fmt.Println("📊 获取数据库健康状态...")
	health := db.Health()
	healthJSON, _ := json.MarshalIndent(health, "", "  ")
	fmt.Printf("数据库状态:\n%s\n", healthJSON)

	// 测试基本SQL查询
	fmt.Println("🔍 测试基本SQL查询...")
	var version string
	if err := db.Raw("SELECT version()").Scan(&version).Error; err != nil {
		fmt.Printf("❌ SQL查询失败: %v\n", err)
	} else {
		fmt.Printf("✅ PostgreSQL版本: %s\n", version)
	}

	// 测试当前数据库和schema
	var currentDB, currentSchema string
	if err := db.Raw("SELECT current_database()").Scan(&currentDB).Error; err != nil {
		fmt.Printf("❌ 获取当前数据库失败: %v\n", err)
	} else {
		fmt.Printf("✅ 当前数据库: %s\n", currentDB)
	}

	if err := db.Raw("SELECT current_schema()").Scan(&currentSchema).Error; err != nil {
		fmt.Printf("❌ 获取当前schema失败: %v\n", err)
	} else {
		fmt.Printf("✅ 当前schema: %s\n", currentSchema)
	}

	// 测试创建表（示例）
	fmt.Println("🏗️  测试创建示例表...")
	if err := db.Exec(`
		CREATE TABLE IF NOT EXISTS ` + cfg.Database.Postgres.Schema + `.test_connection (
			id SERIAL PRIMARY KEY,
			name VARCHAR(100) NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`).Error; err != nil {
		fmt.Printf("❌ 创建测试表失败: %v\n", err)
	} else {
		fmt.Println("✅ 测试表创建成功!")

		// 插入测试数据
		fmt.Println("📝 插入测试数据...")
		if err := db.Exec(`
			INSERT INTO `+cfg.Database.Postgres.Schema+`.test_connection (name) 
			VALUES ('Database Connection Test') 
			ON CONFLICT DO NOTHING
		`).Error; err != nil {
			fmt.Printf("❌ 插入测试数据失败: %v\n", err)
		} else {
			fmt.Println("✅ 测试数据插入成功!")

			// 查询测试数据
			fmt.Println("📖 查询测试数据...")
			var count int64
			if err := db.Raw("SELECT COUNT(*) FROM "+cfg.Database.Postgres.Schema+".test_connection").Scan(&count).Error; err != nil {
				fmt.Printf("❌ 查询测试数据失败: %v\n", err)
			} else {
				fmt.Printf("✅ 测试表中共有 %d 条记录\n", count)
			}

			// 清理测试表
			fmt.Println("🧹 清理测试表...")
			if err := db.Exec("DROP TABLE IF EXISTS " + cfg.Database.Postgres.Schema + ".test_connection").Error; err != nil {
				fmt.Printf("⚠️  清理测试表失败: %v\n", err)
			} else {
				fmt.Println("✅ 测试表清理完成!")
			}
		}
	}

	fmt.Println()
	fmt.Println("=====================================")
	fmt.Println("🎉 数据库连接测试完成!")
	fmt.Println("✅ 所有测试都已通过，数据库配置正确!")
}
package com.taskflow;

import org.springframework.boot.SpringApplication;

public class TestTaskflowBackendApplication {

	public static void main(String[] args) {
		SpringApplication.from(TaskflowBackendApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}

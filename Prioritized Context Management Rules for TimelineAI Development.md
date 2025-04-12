# Prioritized Context Management Rules for TimelineAI Development

## Priority 1: Essential Context Management Rules

These rules are critical for maintaining context window efficiency and must be followed at all times:

### 1. Single Component Focus
- **Rule 1.1**: Work on only ONE component in a single development session
- **Rule 1.2**: Complete development sessions with clear stopping points
- **Rule 1.3**: When switching components, explicitly end the current session and start a new one

### 2. Implementation Chunking
- **Rule 4.1**: Divide component implementation into logical chunks of 100-200 lines of code
- **Rule 4.2**: Complete and test one chunk before moving to the next
- **Rule 4.3**: Create a "chunk map" at the start of component development

### 3. File Management Strategy
- **Rule 2.1**: Limit active files to a maximum of 3-5 files per development session
- **Rule 2.2**: Prioritize files in this order: (1) current implementation file, (2) interface contract, (3) test file
- **Rule 2.3**: Close files explicitly when no longer needed for immediate development

### 4. Interface Contract Handling
- **Rule 3.1**: Begin development by fully understanding the component's interface contract
- **Rule 3.2**: Create a simplified "interface summary" document for quick reference
- **Rule 3.3**: For dependent components, only load interface contracts, never implementations

### 5. Context Refreshing
- **Rule 8.1**: Begin each development session with a "context primer" that includes component responsibility, status, goals, and interface requirements
- **Rule 8.4**: Use explicit context management commands to refresh critical information

## Priority 2: Important Efficiency Rules

These rules significantly improve development efficiency but have some flexibility in implementation:

### 6. Testing Strategy
- **Rule 5.1**: Write tests immediately after implementing each feature, not at the end
- **Rule 5.2**: Focus on one test category at a time (unit, contract, or integration)
- **Rule 5.3**: Use test-driven development for complex features

### 7. Dependency Management
- **Rule 7.1**: Create simplified mock implementations of dependencies early
- **Rule 7.2**: Use dependency injection consistently
- **Rule 7.3**: Maintain a "dependency interface map" document for quick reference

### 8. Code Organization
- **Rule 9.1**: Use a consistent file structure across all components
- **Rule 9.2**: Organize code with clear separation of concerns
- **Rule 9.3**: Keep individual functions under 50 lines

### 9. Progress Tracking
- **Rule 10.1**: Maintain a component completion checklist
- **Rule 10.2**: Track implementation status at the feature level

## Priority 3: Supporting Best Practices

These rules enhance overall development quality but can be adapted based on specific component needs:

### 10. Documentation Approach
- **Rule 6.1**: Document each function/method immediately after implementation
- **Rule 6.2**: Maintain a running "documentation outline" that's updated incrementally
- **Rule 6.3**: Use standardized documentation templates to reduce cognitive load

### 11. Advanced Context Management
- **Rule 8.2**: Periodically reload interface contracts to ensure compliance
- **Rule 8.3**: Maintain a development journal to track decisions and progress
- **Rule 10.3**: Record known limitations and technical debt
- **Rule 10.4**: Document integration points and assumptions

## Essential Context Management Commands

These commands should be used consistently throughout development:

- `!focus [component_name]` - Declare focus on a specific component
- `!load_interface [component_name]` - Load a component's interface contract
- `!close_file [file_name]` - Explicitly remove a file from context
- `!summarize_progress` - Generate a summary of current development status
- `!verify_interface` - Check current implementation against interface contract
- `!next_chunk` - Move to the next implementation chunk
- `!end_session` - Explicitly end the current development session

## Recommended Development Session Structure

1. **Session Initialization** (Priority 1):
   ```
   !focus [ComponentName]
   !load_interface [ComponentName]
   !load_interface [DependencyComponent]  # Only if needed
   
   # Define session goals (2-3 specific tasks)
   # Review current implementation status
   ```

2. **Implementation Phase** (Priority 1):
   ```
   !focus_chunk "[ChunkName]"
   
   # Implement chunk
   # Test chunk
   # Document chunk
   
   !close_file [completed_file]  # When moving to next file
   ```

3. **Session Closure** (Priority 1):
   ```
   !verify_interface
   !summarize_progress
   !end_session
   ```

By prioritizing these rules, AI developers can focus on the most critical context management strategies first, ensuring efficient use of context windows while maintaining high-quality development practices.

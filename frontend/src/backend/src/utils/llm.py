"""Helper functions for LLM"""

import json
from typing import TypeVar, Type, Optional, Any
from pydantic import BaseModel
from utils.progress import progress

T = TypeVar('T', bound=BaseModel)

def call_llm(
    prompt: Any,
    model_name: str,
    model_provider: str,
    pydantic_model: Type[T],
    agent_name: Optional[str] = None,
    max_retries: int = 3,
    default_factory = None
) -> T:
    """
    Makes an LLM call with retry logic, handling both Deepseek and non-Deepseek models.
    
    Args:
        prompt: The prompt to send to the LLM
        model_name: Name of the model to use
        model_provider: Provider of the model
        pydantic_model: The Pydantic model class to structure the output
        agent_name: Optional name of the agent for progress updates
        max_retries: Maximum number of retries (default: 3)
        default_factory: Optional factory function to create default response on failure
        
    Returns:
        An instance of the specified Pydantic model
    """
    from llm.models import get_model, get_model_info
    
    model_info = get_model_info(model_name)
    llm = get_model(model_name, model_provider)
    
    # For non-JSON support models, we can use structured output
    if not (model_info and not model_info.has_json_mode()):
        llm = llm.with_structured_output(
            pydantic_model,
            method="json_mode",
        )
    
    # Call the LLM with retries
    for attempt in range(max_retries):
        try:
            # Call the LLM
            result = llm.invoke(prompt)
            
            # COMPREHENSIVE DEBUG LOGGING
            print(f"\n🔍 LLM DEBUG - Agent: {agent_name}, Attempt: {attempt + 1}")
            print(f"📝 Model: {model_name} ({model_provider})")
            print(f"📊 Result Type: {type(result)}")
            
            if hasattr(result, 'content'):
                content = result.content
                print(f"📄 Raw Content Length: {len(content)}")
                print(f"📄 Raw Content Preview: {content[:300]}...")
            else:
                content = str(result)
                print(f"📄 Raw Result: {content[:300]}...")
            
            # For non-JSON support models, we need to extract and parse the JSON manually
            if model_info and not model_info.has_json_mode():
                print(f"🎯 Using DeepSeek JSON extraction for {agent_name}")
                parsed_result = extract_json_from_deepseek_response(result.content)
                if parsed_result:
                    print(f"✅ DeepSeek extraction successful: {parsed_result}")
                    return pydantic_model(**parsed_result)
                else:
                    print(f"❌ DeepSeek extraction failed")
            else:
                print(f"🎯 Using JSON mode parsing for {agent_name}")
                
                # Enhanced JSON mode parsing with fallback extraction
                if hasattr(result, 'content'):
                    # Try direct parsing first (for structured output)
                    if isinstance(result, pydantic_model):
                        print(f"✅ Direct Pydantic model returned")
                        return result
                    
                    # Fallback: Extract JSON from content if structured output failed
                    try:
                        import re
                        import json
                        
                        print(f"🔍 Attempting JSON extraction from content...")
                        
                        # Try direct JSON parsing first
                        try:
                            parsed = json.loads(content)
                            print(f"✅ Direct JSON parse successful: {parsed}")
                            validated = pydantic_model(**parsed)
                            print(f"✅ Pydantic validation successful")
                            return validated
                        except json.JSONDecodeError as direct_e:
                            print(f"❌ Direct JSON parse failed: {direct_e}")
                        except Exception as validation_e:
                            print(f"❌ Pydantic validation failed: {validation_e}")
                        
                        # Try to find JSON in the response using regex
                        json_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
                        json_matches = re.findall(json_pattern, content, re.DOTALL)
                        print(f"🔍 Found {len(json_matches)} JSON-like patterns")
                        
                        for i, json_str in enumerate(json_matches):
                            try:
                                print(f"🧪 Testing JSON pattern {i+1}: {json_str[:100]}...")
                                parsed = json.loads(json_str)
                                print(f"✅ JSON pattern {i+1} parsed successfully: {parsed}")
                                validated = pydantic_model(**parsed)
                                print(f"✅ JSON pattern {i+1} validated successfully")
                                return validated
                            except json.JSONDecodeError as json_e:
                                print(f"❌ JSON pattern {i+1} parse failed: {json_e}")
                            except Exception as val_e:
                                print(f"❌ JSON pattern {i+1} validation failed: {val_e}")
                                
                        # If no valid JSON found, log and continue to retry
                        print(f"❌ No valid JSON found in LLM response for {agent_name}")
                        print(f"📄 Full content for analysis: {content}")
                        
                    except Exception as parse_e:
                        print(f"❌ JSON extraction completely failed for {agent_name}: {parse_e}")
                        
                else:
                    print(f"⚠️ No content attribute, returning raw result")
                    return result
                
        except Exception as e:
            if agent_name:
                progress.update_status(agent_name, None, f"Error - retry {attempt + 1}/{max_retries}")
            
            print(f"LLM call attempt {attempt + 1} failed for {agent_name}: {e}")
            
            if attempt == max_retries - 1:
                print(f"Error in LLM call after {max_retries} attempts for {agent_name}: {e}")
                # Use default_factory if provided, otherwise create a basic default
                if default_factory:
                    return default_factory()
                return create_default_response(pydantic_model)

    # This should never be reached due to the retry logic above
    return create_default_response(pydantic_model)

def create_default_response(model_class: Type[T]) -> T:
    """Creates a safe default response based on the model's fields."""
    default_values = {}
    for field_name, field in model_class.model_fields.items():
        if field.annotation == str:
            default_values[field_name] = "Error in analysis, using default"
        elif field.annotation == float:
            default_values[field_name] = 0.0
        elif field.annotation == int:
            default_values[field_name] = 0
        elif hasattr(field.annotation, "__origin__") and field.annotation.__origin__ == dict:
            default_values[field_name] = {}
        else:
            # For other types (like Literal), try to use the first allowed value
            if hasattr(field.annotation, "__args__"):
                default_values[field_name] = field.annotation.__args__[0]
            else:
                default_values[field_name] = None
    
    return model_class(**default_values)

def extract_json_from_deepseek_response(content: str) -> Optional[dict]:
    """Extracts JSON from Deepseek's markdown-formatted response."""
    try:
        json_start = content.find("```json")
        if json_start != -1:
            json_text = content[json_start + 7:]  # Skip past ```json
            json_end = json_text.find("```")
            if json_end != -1:
                json_text = json_text[:json_end].strip()
                return json.loads(json_text)
    except Exception as e:
        print(f"Error extracting JSON from Deepseek response: {e}")
    return None

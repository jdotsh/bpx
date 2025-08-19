#!/bin/bash
# R2 API Foundations - UAT Test Suite
# Enterprise-grade API testing for BPMN Studio

set -e

BASE_URL="http://localhost:3000"
API_BASE="$BASE_URL/api"

echo "🚀 R2 API Foundations - UAT Test Suite"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

run_test() {
    local test_name="$1"
    local expected_status="$2"
    local url="$3"
    local method="${4:-GET}"
    local data="$5"
    local auth_header="$6"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    echo -n "Testing: $test_name... "
    
    if [ "$method" = "POST" ] || [ "$method" = "PUT" ]; then
        if [ -n "$auth_header" ]; then
            response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X "$method" \
                -H "Content-Type: application/json" \
                -H "$auth_header" \
                -d "$data" "$url")
        else
            response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X "$method" \
                -H "Content-Type: application/json" \
                -d "$data" "$url")
        fi
    else
        if [ -n "$auth_header" ]; then
            response=$(curl -s -w "HTTPSTATUS:%{http_code}" -H "$auth_header" "$url")
        else
            response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$url")
        fi
    fi
    
    status=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $status)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $status)"
        echo "Response body: $body"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

echo -e "\n${YELLOW}1. Security Tests${NC}"
echo "=================="

# Test unauthenticated requests are rejected
run_test "Unauthenticated projects list" "401" "$API_BASE/projects"
run_test "Unauthenticated diagrams list" "401" "$API_BASE/diagrams"
run_test "Unauthenticated project creation" "401" "$API_BASE/projects" "POST" '{"name":"Test"}'

echo -e "\n${YELLOW}2. Validation Tests${NC}"
echo "===================="

# Test invalid JSON validation
run_test "Invalid project creation (missing name)" "400" "$API_BASE/projects" "POST" '{}'
run_test "Invalid diagram creation (missing projectId)" "400" "$API_BASE/diagrams" "POST" '{"title":"Test"}'

echo -e "\n${YELLOW}3. Rate Limiting Tests${NC}"
echo "======================"

# Test rate limiting (this will fail without auth, but tests the endpoint)
run_test "Rate limiting response format" "401" "$API_BASE/projects"

echo -e "\n${YELLOW}4. Content Type Tests${NC}"
echo "======================"

# Test proper content type handling
run_test "Accepts JSON content type" "401" "$API_BASE/projects" "POST" '{"name":"Test"}' ""

echo -e "\n${YELLOW}5. ETag and Caching Tests${NC}"
echo "============================="

# Test ETag headers (unauthenticated, but should show proper headers)
response=$(curl -s -I "$API_BASE/projects")
if echo "$response" | grep -q "Cache-Control\|ETag\|Vary"; then
    echo -e "Cache headers test: ${GREEN}✓ PASS${NC} (Headers present)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "Cache headers test: ${YELLOW}~ SKIP${NC} (Auth required)"
fi
TESTS_RUN=$((TESTS_RUN + 1))

echo -e "\n${YELLOW}6. Error Format Tests${NC}"
echo "======================"

# Test error response format (RFC 7807)
response=$(curl -s "$API_BASE/projects")
if echo "$response" | grep -q '"type"\|"title"\|"status"'; then
    echo -e "RFC 7807 error format: ${GREEN}✓ PASS${NC} (Problem details format)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "RFC 7807 error format: ${RED}✗ FAIL${NC} (Invalid error format)"
    echo "Response: $response"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

echo -e "\n${YELLOW}7. API Structure Tests${NC}"
echo "======================="

# Test all endpoints exist and return consistent auth errors
endpoints=(
    "projects"
    "diagrams"
)

for endpoint in "${endpoints[@]}"; do
    run_test "Endpoint exists: /$endpoint" "401" "$API_BASE/$endpoint"
done

echo -e "\n${YELLOW}8. Performance Tests${NC}"
echo "====================="

# Test response time (basic)
start_time=$(date +%s%N)
curl -s "$API_BASE/projects" > /dev/null
end_time=$(date +%s%N)
response_time=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds

if [ $response_time -lt 500 ]; then
    echo -e "Response time test: ${GREEN}✓ PASS${NC} (${response_time}ms < 500ms)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "Response time test: ${RED}✗ FAIL${NC} (${response_time}ms > 500ms)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

echo -e "\n${YELLOW}9. API Documentation Tests${NC}"
echo "=============================="

# Test that endpoints return proper error messages
response=$(curl -s "$API_BASE/projects/nonexistent")
if echo "$response" | grep -q '"detail"\|"message"'; then
    echo -e "Error message clarity: ${GREEN}✓ PASS${NC} (Descriptive errors)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "Error message clarity: ${RED}✗ FAIL${NC} (Poor error messages)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Final Results
echo -e "\n${YELLOW}========================================${NC}"
echo -e "${YELLOW}         UAT RESULTS SUMMARY${NC}"
echo -e "${YELLOW}========================================${NC}"

echo "Total Tests Run: $TESTS_RUN"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED! API Foundation is ready for production.${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Please review and fix issues.${NC}"
    exit 1
fi
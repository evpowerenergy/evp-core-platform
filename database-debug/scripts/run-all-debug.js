// Run All Database Debug Scripts
// วัตถุประสงค์: รัน scripts ทั้งหมดสำหรับ debug database
import { createSupabaseClient, logInfo, logError, logSuccess } from './config.js';

async function runAllDebug() {
  console.log('🚀 เริ่มต้นการ Debug Database ทั้งหมด...\n');
  
  try {
    // 1. ค้นหาข้อมูลลูกค้า
    console.log('🔍 === 1. ค้นหาข้อมูลลูกค้า ===');
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    try {
      const { stdout: searchOutput } = await execAsync('node search-customer.js');
      console.log(searchOutput);
    } catch (error) {
      logError(error, 'การค้นหาข้อมูลลูกค้า');
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 2. วิเคราะห์โครงสร้าง Database
    console.log('📊 === 2. วิเคราะห์โครงสร้าง Database ===');
    try {
      const { stdout: structureOutput } = await execAsync('node database-structure.js');
      console.log(structureOutput);
    } catch (error) {
      logError(error, 'การวิเคราะห์โครงสร้าง Database');
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 3. วิเคราะห์ข้อมูลแบบละเอียด
    console.log('🔬 === 3. วิเคราะห์ข้อมูลแบบละเอียด ===');
    try {
      const { stdout: analyzeOutput } = await execAsync('node analyze-database.js');
      console.log(analyzeOutput);
    } catch (error) {
      logError(error, 'การวิเคราะห์ข้อมูลแบบละเอียด');
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 4. สรุปผลการ Debug
    console.log('📋 === 4. สรุปผลการ Debug ===');
    logSuccess('การ Debug Database เสร็จสิ้น!');
    logInfo('ไฟล์ที่สร้าง:');
    logInfo('- search-customer.js: ค้นหาข้อมูลลูกค้า');
    logInfo('- database-structure.js: วิเคราะห์โครงสร้าง');
    logInfo('- analyze-database.js: วิเคราะห์ข้อมูลแบบละเอียด');
    logInfo('- common-queries.sql: SQL queries ที่ใช้บ่อย');
    logInfo('- config.js: การตั้งค่า');
    
  } catch (error) {
    logError(error, 'การรัน Debug Scripts');
  }
}

// รันการ Debug ทั้งหมด
runAllDebug();

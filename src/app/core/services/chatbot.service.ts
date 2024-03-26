import { Injectable } from '@angular/core';
//import { SqlDatabase } from 'langchain/sql_db';
//import { DataSource } from 'typeorm';
import { OpenAI } from '@langchain/openai';
//import { DataSource } from 'typeorm';
import { DataSource } from 'typeorm';

@Injectable({
  providedIn: 'root',
})
export class ChatbotService {
  static DATA_SOURCE = `localhost\\SQLEXPRESS;Initial Catalog=hello_world;Integrated Security=True;MultipleActiveResultSets=True;TrustServerCertificate=True;Application Name=EntityFramework`;
  // private dataSource!: DataSource;
  constructor() {
    // this.dataSource = new DataSource({
    //   type: 'mssql',
    //   //type: 'sqljs',
    //   //database: ChatbotService.DATA_SOURCE,
    // });
  }
  async testConnection() {
    // SqlDatabase.fromOptionsParams({
    //   appDataSource: new DataSource({
    //     type: 'mysql',
    //     database: ''
    //   })
    // })
    console.log('hello world');
    // const db = await SqlDatabase.fromDataSourceParams({
    //   appDataSource: this.dataSource,
    // });
    // console.log(db.allTables.map((t) => t.tableName));
  }
}

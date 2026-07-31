import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

/**
 * 面试题实体。
 * 由 scripts/import-interview-pdf.py 从 PDF（如《面试精选百题-前端》）解析后写入数据库。
 */
@Entity('interview_questions')
export class InterviewQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 来源 PDF 文件名 */
  @Column({ type: 'varchar', length: 255 })
  source: string;

  /** 大分类，例如：前端基础三件套（HTML/CSS/JS） */
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'category' })
  category: string | null;

  /** 子分类，例如：HTML、CSS、JavaScript */
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'sub_category' })
  subCategory: string | null;

  /** 题号 */
  @Column({ type: 'int', nullable: true, name: 'question_number' })
  questionNumber: number | null;

  /** 题目 */
  @Column({ type: 'text' })
  question: string;

  /** 参考答案 */
  @Column({ type: 'text' })
  answer: string;

  /** 标签，便于后续检索 */
  @Column({ type: 'text', array: true, nullable: true, name: 'tags' })
  tags: string[] | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}

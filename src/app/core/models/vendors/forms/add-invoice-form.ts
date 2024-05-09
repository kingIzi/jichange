export class AddInvoiceForm {
  user_id!: number;
  compid!: string;
  invno!: string;
  auname!: string;
  date!: string;
  edate!: string;
  iedate!: string;
  ptype!: string;
  chus!: string;
  comno!: number;
  ccode!: string;
  ctype!: string;
  cino!: string;
  twvat!: number;
  vtamou!: number;
  total!: string;
  Inv_remark!: string;
  lastrow!: number;
  details!: InvoiceDetail[];
  sno!: string;
  warrenty!: string;
  goods_status!: string;
  delivery_status!: string;
}

export class InvoiceDetail {
  item_description!: string;
  item_qty!: string;
  item_unit_price!: number;
  item_total_amount!: number;
  remarks!: string;
}

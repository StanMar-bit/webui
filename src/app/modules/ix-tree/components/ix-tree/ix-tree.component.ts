import { Direction, Directionality } from '@angular/cdk/bidi';
import { DataSource } from '@angular/cdk/collections';
import { CdkTree, TreeControl } from '@angular/cdk/tree';
import {
  ChangeDetectorRef,
  Component,
  Input,
  IterableDiffer,
  IterableDiffers,
  OnDestroy,
  Optional,
  OnInit,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { Observable, Subject, takeUntil } from 'rxjs';
import { IxTreeNodeOutletDirective } from 'app/modules/ix-tree/directives/ix-tree-node-outlet.directive';

@Component({ template: '' })
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class IxTree<T> extends CdkTree<T> implements OnInit, OnDestroy {
  dir: Direction = 'ltr';
  _dataSourceChanged = new Subject<void>();
  // Outlets within the tree's template where the dataNodes will be inserted.
  @ViewChild(IxTreeNodeOutletDirective, { static: true }) override _nodeOutlet: IxTreeNodeOutletDirective<T>;
  private destroy$ = new Subject<void>();

  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('ixTreeControl') override treeControl!: TreeControl<T, any>;
  @Input('ixDataSource')
  override get dataSource(): DataSource<T> | Observable<T[]> | T[] {
    return super.dataSource;
  }
  override set dataSource(dataSource$: DataSource<T> | Observable<T[]> | T[]) {
    super.dataSource = dataSource$;
  }

  constructor(
    protected differs: IterableDiffers,
    protected changeDetectorRef: ChangeDetectorRef,
    @Optional() private directionality?: Directionality,
  ) {
    super(differs, changeDetectorRef);
  }

  override ngOnInit(): void {
    super.ngOnInit();

    if (this.directionality) {
      this.dir = this.directionality.value;
      this.directionality.change?.pipe(takeUntil(this.destroy$)).subscribe((direction: Direction) => {
        this.dir = direction;
        this.changeDetectorRef.detectChanges();
      });
    }
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.destroy$.next();
    this.destroy$.complete();
  }

  override renderNodeChanges(
    data: T[] | readonly T[],
    dataDiffer?: IterableDiffer<T>,
    viewContainer?: ViewContainerRef,
    parentData?: T,
  ): void {
    super.renderNodeChanges(data, dataDiffer, viewContainer, parentData);
    this._dataSourceChanged.next();
  }
}

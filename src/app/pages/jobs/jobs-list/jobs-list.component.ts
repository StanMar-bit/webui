import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef,
  Component, OnInit, QueryList, TrackByFunction, ViewChild, ViewChildren,
} from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Subject, BehaviorSubject } from 'rxjs';
import {
  filter, map, switchMap,
} from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import { CoreEvent } from 'app/interfaces/events';
import { Job } from 'app/interfaces/job.interface';
import { EmptyConfig, EmptyType } from 'app/modules/entity/entity-empty/entity-empty.component';
import { EntityToolbarComponent } from 'app/modules/entity/entity-toolbar/entity-toolbar.component';
import { ToolbarConfig } from 'app/modules/entity/entity-toolbar/models/control-config.interface';
import { IxDetailRowDirective } from 'app/modules/ix-tables/directives/ix-detail-row.directive';
import { abortJobPressed } from 'app/modules/jobs/store/job.actions';
import {
  JobSlice, selectJobState, selectJobs, selectFailedJobs, selectRunningJobs,
} from 'app/modules/jobs/store/job.selectors';
import { DialogService } from 'app/services';
import { CoreService } from 'app/services/core-service/core.service';
import { JobTab } from './job-tab.enum';

@UntilDestroy()
@Component({
  templateUrl: './jobs-list.component.html',
  styleUrls: ['./jobs-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobsListComponent implements OnInit, AfterViewInit {
  isLoading$ = this.store$.select(selectJobState).pipe(map((state) => state.isLoading));
  error$ = this.store$.select(selectJobState).pipe(map((state) => state.error));
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChildren(IxDetailRowDirective) private detailRows: QueryList<IxDetailRowDirective>;
  dataSource: MatTableDataSource<Job> = new MatTableDataSource([]);
  displayedColumns = ['name', 'state', 'id', 'time_started', 'time_finished', 'arguments_logs'];
  expandedRow: Job;
  toolbarConfig: ToolbarConfig;
  settingsEvent$: Subject<CoreEvent> = new Subject();
  filterString = '';
  selectedIndex: JobTab = 0;
  emptyConfig: EmptyConfig = {
    type: EmptyType.NoPageData,
    large: true,
    title: this.translate.instant('No tasks'),
  };
  loadingConfig: EmptyConfig = {
    type: EmptyType.Loading,
    large: false,
    title: this.translate.instant('Loading...'),
  };
  selector$ = new BehaviorSubject(selectJobs);

  readonly JobState = JobState;
  readonly trackByJobId: TrackByFunction<Job> = (_, job) => job.id;

  constructor(
    private core: CoreService,
    private translate: TranslateService,
    private dialogService: DialogService,
    private store$: Store<JobSlice>,
    private cdr: ChangeDetectorRef,
  ) {}

  onAborted(job: Job): void {
    this.dialogService
      .confirm({
        title: this.translate.instant('Abort'),
        message: this.translate.instant('Are you sure you want to abort the <b>{task}</b> task?', { task: job.method }),
        hideCheckBox: true,
        buttonMsg: this.translate.instant('Abort'),
        cancelMsg: this.translate.instant('Cancel'),
        disableClose: true,
      })
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.store$.dispatch(abortJobPressed({ job }));
      });
  }

  ngOnInit(): void {
    this.setupToolbar();

    this.selector$.pipe(
      switchMap((selector) => this.store$.select(selector)),
      untilDestroyed(this),
    ).subscribe((jobs) => {
      this.dataSource.data = jobs;
      this.dataSource.sort = this.sort;
      this.cdr.markForCheck();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  setupToolbar(): void {
    this.settingsEvent$ = new Subject();
    this.settingsEvent$.pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      if (evt.data.event_control === 'filter') {
        this.filterString = evt.data.filter;
        this.dataSource.filter = evt.data.filter;
      }
    });

    const controls = [
      {
        name: 'filter',
        type: 'input',
        value: this.filterString,
      },
    ];

    const toolbarConfig = {
      target: this.settingsEvent$,
      controls,
    };
    const settingsConfig = {
      actionType: EntityToolbarComponent,
      actionConfig: toolbarConfig,
    };

    this.toolbarConfig = toolbarConfig;

    this.core.emit({ name: 'GlobalActions', data: settingsConfig, sender: this });
  }

  onToggle(job: Job): void {
    this.expandedRow = this.expandedRow === job ? null : job;
    this.toggleDetailRows();
    this.cdr.markForCheck();
  }

  toggleDetailRows(): void {
    this.detailRows.forEach((row) => {
      if (row.expanded && row.ixDetailRow !== this.expandedRow) {
        row.close();
      } else if (!row.expanded && row.ixDetailRow === this.expandedRow) {
        row.open();
      }
    });
  }

  onTabChange(tab: MatTabChangeEvent): void {
    this.selectedIndex = tab.index;
    switch (this.selectedIndex) {
      case JobTab.Failed:
        this.selector$.next(selectFailedJobs);
        this.expandedRow = null;
        this.emptyConfig.title = this.translate.instant('There are no failed tasks.');
        break;
      case JobTab.Running:
        this.selector$.next(selectRunningJobs);
        this.expandedRow = null;
        this.emptyConfig.title = this.translate.instant('There are no active tasks.');
        break;
      case JobTab.All:
      default:
        this.selector$.next(selectJobs);
        this.expandedRow = null;
        this.emptyConfig.title = this.translate.instant('There are no tasks.');
        break;
    }
  }
}
